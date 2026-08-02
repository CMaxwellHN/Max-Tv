const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// ── Perfiles: bloquear/desbloquear (independiente del correo) ──
router.patch('/profiles/:id/status', async (req, res) => {
  const { status } = req.body; // 'active' | 'blocked'
  await pool.query('UPDATE profiles SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ ok: true });
});

// ── Crear correo autorizado + su perfil juntos, en un solo paso ──
router.post('/emails-with-profile', async (req, res) => {
  const { email, profileName, avatar, pin } = req.body;
  if (!email || !profileName) {
    return res.status(400).json({ error: 'Correo y nombre de perfil son requeridos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const emailResult = await client.query(
      `INSERT INTO authorized_emails (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET status = 'active' RETURNING *`,
      [email.toLowerCase().trim()]
    );

    const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
    const profileResult = await client.query(
      `INSERT INTO profiles (name, avatar, pin_hash, kind)
       VALUES ($1, $2, $3, 'standard') RETURNING id, name, avatar, kind, status`,
      [profileName, avatar || '👤', pinHash]
    );

    await client.query('COMMIT');
    res.status(201).json({ email: emailResult.rows[0], profile: profileResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando correo + perfil:', err);
    res.status(500).json({ error: 'Error interno', detail: err.message });
  } finally {
    client.release();
  }
});

// ── Correos autorizados ──
router.get('/emails', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM authorized_emails ORDER BY created_at ASC');
  res.json(rows);
});

router.post('/emails', async (req, res) => {
  const { email } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO authorized_emails (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET status = 'active' RETURNING *`,
    [email.toLowerCase().trim()]
  );
  res.status(201).json(rows[0]);
});

router.patch('/emails/:id/status', async (req, res) => {
  const { status } = req.body; // solo afecta el correo, no toca perfiles
  await pool.query('UPDATE authorized_emails SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ ok: true });
});

router.delete('/emails/:id', async (req, res) => {
  await pool.query('DELETE FROM authorized_emails WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

// ── Dispositivos (los TVs) ──
router.get('/devices', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT d.*, p.name as profile_name FROM devices d
     LEFT JOIN profiles p ON p.id = d.active_profile_id
     ORDER BY d.created_at ASC`
  );
  res.json(rows);
});

// ── Estadísticas de uso (últimos 7 días) ──
router.get('/stats/usage', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.name, SUM(COALESCE(wh.duration_seconds,0)) / 3600.0 AS hours
    FROM profiles p
    LEFT JOIN watch_history wh ON wh.profile_id = p.id AND wh.watched_at > now() - interval '7 days'
    GROUP BY p.name ORDER BY hours DESC
  `);
  res.json(rows);
});

router.get('/stats/content-mix', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT content_type, COUNT(*) AS plays
    FROM watch_history WHERE watched_at > now() - interval '7 days'
    GROUP BY content_type ORDER BY plays DESC
  `);
  res.json(rows);
});

module.exports = router;

