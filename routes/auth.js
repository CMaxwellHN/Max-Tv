const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const router = express.Router();

// Paso 1: verificar que el correo esté en la lista blanca
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Correo requerido' });

  const { rows } = await pool.query(
    'SELECT status, is_admin FROM authorized_emails WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  if (!rows.length) return res.status(403).json({ error: 'Este correo no está autorizado para MaxTV' });
  if (rows[0].status === 'blocked') return res.status(403).json({ error: 'Este correo fue bloqueado por el admin' });

  res.json({ ok: true, isAdmin: rows[0].is_admin });
});

// Paso 2: elegir perfil + PIN, devuelve el token de sesión del dispositivo
router.post('/select-profile', async (req, res) => {
  const { email, profileId, pin } = req.body;

  const { rows: emailRows } = await pool.query(
    'SELECT status FROM authorized_emails WHERE email = $1',
    [email?.toLowerCase().trim()]
  );
  if (!emailRows.length || emailRows[0].status === 'blocked') {
    return res.status(403).json({ error: 'Correo no autorizado' });
  }

  const { rows } = await pool.query('SELECT * FROM profiles WHERE id = $1', [profileId]);
  if (!rows.length) return res.status(404).json({ error: 'Perfil no encontrado' });
  const profile = rows[0];

  if (profile.status === 'blocked') return res.status(403).json({ error: 'Este perfil está bloqueado' });

  if (profile.pin_hash) {
    if (!pin) return res.status(401).json({ error: 'Este perfil requiere PIN' });
    const valid = await bcrypt.compare(pin, profile.pin_hash);
    if (!valid) return res.status(401).json({ error: 'PIN incorrecto' });
  }

  const token = jwt.sign(
    { email: email.toLowerCase().trim(), profileId: profile.id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, profile: { id: profile.id, name: profile.name, avatar: profile.avatar, kind: profile.kind } });
});

module.exports = router;
