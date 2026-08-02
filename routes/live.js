const express = require('express');
const pool = require('../config/db');
const xtream = require('../services/xtream');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const CACHE_TTL_MINUTES = 30;

async function getCached(kind, category, fetchFn) {
  const { rows } = await pool.query(
    `SELECT payload, refreshed_at FROM xtream_cache
     WHERE kind = $1 AND (category = $2 OR ($2 IS NULL AND category IS NULL))
     ORDER BY refreshed_at DESC LIMIT 1`,
    [kind, category || null]
  );
  const fresh = rows.length && (Date.now() - new Date(rows[0].refreshed_at).getTime()) < CACHE_TTL_MINUTES * 60 * 1000;
  if (fresh) return rows[0].payload;

  const data = await fetchFn();
  await pool.query(
    `INSERT INTO xtream_cache (kind, category, payload) VALUES ($1,$2,$3)`,
    [kind, category || null, JSON.stringify(data)]
  );
  return data;
}

router.get('/categories', requireAuth, async (req, res) => {
  try {
    const data = await getCached('live', null, () => xtream.getLiveCategories());
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'No se pudo consultar Tele Latino', detail: err.message });
  }
});

router.get('/channels', requireAuth, async (req, res) => {
  const { categoryId } = req.query;
  try {
    const data = await getCached('live', categoryId, () => xtream.getLiveStreams(categoryId));
    const channels = data.map((c) => ({
      id: c.stream_id,
      name: c.name,
      logo: c.stream_icon,
      category: c.category_id,
      streamUrl: xtream.liveStreamUrl(c.stream_id),
    }));
    res.json(channels);
  } catch (err) {
    res.status(502).json({ error: 'No se pudo consultar Tele Latino', detail: err.message });
  }
});

router.get('/epg/:streamId', requireAuth, async (req, res) => {
  try {
    const data = await xtream.getShortEpg(req.params.streamId);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'No se pudo consultar el EPG', detail: err.message });
  }
});

module.exports = router;
