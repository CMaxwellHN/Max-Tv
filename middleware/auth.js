const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Verifica que el token sea válido y que el correo siga autorizado (no bloqueado)
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      'SELECT email, status, is_admin FROM authorized_emails WHERE email = $1',
      [payload.email]
    );
    if (!rows.length || rows[0].status === 'blocked') {
      return res.status(403).json({ error: 'Correo bloqueado o no autorizado' });
    }
    req.user = { email: rows[0].email, isAdmin: rows[0].is_admin, profileId: payload.profileId || null };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Solo el admin puede hacer esto' });
  next();
}

module.exports = { requireAuth, requireAdmin };
