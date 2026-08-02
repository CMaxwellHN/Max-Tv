const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Lista pública de perfiles (para la pantalla de selección, sin PIN)
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, avatar, kind, status FROM profiles ORDER BY created_at ASC`
  );
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, avatar, pin, kind, adultContentBlocked, dailyLimitMinutes } = req.body;

  const count = await pool.query('SELECT COUNT(*) FROM profiles');
  if (parseInt(count.rows[0].count, 10) >= 5) {
    return res.status(400).json({ error: 'Máximo 5 perfiles' });
  }

  const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
  const { rows } = await pool.query(
    `INSERT INTO profiles (name, avatar, pin_hash, kind, adult_content_blocked, daily_limit_minutes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, avatar, kind`,
    [name, avatar || '👤', pinHash, kind || 'standard', !!adultContentBlocked, dailyLimitMinutes || null]
  );
  res.status(201).json(rows[0]);
});

// Retomar / continuar viendo, favoritos, historial de un perfil
router.get('/:id/continue-watching', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (content_id) content_id, content_type, title, progress_seconds, duration_seconds, watched_at
     FROM watch_history WHERE profile_id = $1
     ORDER BY content_id, watched_at DESC LIMIT 20`,
    [req.params.id]
  );
  res.json(rows);
});

router.get('/:id/favorites', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM favorites WHERE profile_id = $1', [req.params.id]);
  res.json(rows);
});

router.post('/:id/favorites', requireAuth, async (req, res) => {
  const { contentType, contentId, title } = req.body;
  await pool.query(
    `INSERT INTO favorites (profile_id, content_type, content_id, title)
     VALUES ($1,$2,$3,$4) ON CONFLICT (profile_id, content_type, content_id) DO NOTHING`,
    [req.params.id, contentType, contentId, title]
  );
  res.status(201).json({ ok: true });
});

module.exports = router;
