const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const router = express.Router();

// Crea el primer perfil admin, SOLO si todavía no existe ningún perfil.
router.post('/first-profile', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error en /first-profile:', err);
    res.status(500).json({ error: 'Error interno', detail: err.message });
  }
});

// Agrega el primer correo autorizado admin, SOLO si la lista está vacía.
router.post('/first-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Correo requerido' });

    const count = await pool.query('SELECT COUNT(*) FROM authorized_emails');
    if (parseInt(count.rows[0].count, 10) > 0) {
      return res.status(403).json({ error: 'Ya existe al menos un correo autorizado. Esta ruta ya no está disponible.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO authorized_emails (email, is_admin) VALUES ($1, true) RETURNING email, is_admin`,
      [email.toLowerCase().trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error en /first-email:', err);
    res.status(500).json({ error: 'Error interno', detail: err.message });
  }
});

module.exports = router;
