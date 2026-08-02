const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const router = express.Router();

// Crea el primer perfil admin, SOLO si todavía no existe ningún perfil.
// Una vez que exista al menos un perfil, esta ruta deja de funcionar (se autodesactiva).
router.post('/first-profile', async (req, res) => {
  const { name, avatar, pin } = req.body;

  const count = await pool.query('SELECT COUNT(*) FROM profiles');
  if (parseInt(count.rows[0].count, 10) > 0) {
    return res.status(403).json({ error: 'Ya existe al menos un perfil. Esta ruta ya no está disponible.' });
  }

  const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
  const { rows } = await pool.query(
    `INSERT INTO profiles (name, avatar, pin_hash, kind)
     VALUES ($1, $2, $3, 'admin') RETURNING id, name, avatar, kind`,
    [name || 'Admin', avatar || '👑', pinHash]
  );
  res.status(201).json(rows[0]);
});

module.exports = router;
