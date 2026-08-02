const express = require('express');
const xtream = require('../services/xtream');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/movies/categories', requireAuth, async (req, res) => {
  try {
    res.json(await xtream.getVodCategories());
  } catch (err) {
    res.status(502).json({ error: 'No se pudo consultar el catálogo', detail: err.message });
  }
});

router.get('/movies', requireAuth, async (req, res) => {
  try {
    const data = await xtream.getVodStreams(req.query.categoryId);
    res.json(data.map((m) => ({
      id: m.stream_id,
      title: m.name,
      poster: m.stream_icon,
      rating: m.rating,
      year: m.year,
    })));
  } catch (err) {
    res.status(502).json({ error: 'No se pudo consultar el catálogo', detail: err.message });
  }
});

router.get('/movies/:id', requireAuth, async (req, res) => {
  try {
    const info = await xtream.getVodInfo(req.params.id);
    res.json({ ...info, streamUrl: xtream.vodStreamUrl(req.params.id, info?.movie_data?.container_extension) });
  } catch (err) {
    res.status(502).json({ error: 'No se pudo obtener la película', detail: err.message });
  }
});

router.get('/series/categories', requireAuth, async (req, res) => {
  try {
    res.json(await xtream.getSeriesCategories());
  } catch (err) {
    res.status(502).json({ error: 'No se pudo consultar el catálogo', detail: err.message });
  }
});

router.get('/series', requireAuth, async (req, res) => {
  try {
    res.json(await xtream.getSeries(req.query.categoryId));
  } catch (err) {
    res.status(502).json({ error: 'No se pudo consultar el catálogo', detail: err.message });
  }
});

router.get('/series/:id', requireAuth, async (req, res) => {
  try {
    res.json(await xtream.getSeriesInfo(req.params.id));
  } catch (err) {
    res.status(502).json({ error: 'No se pudo obtener la serie', detail: err.message });
  }
});

module.exports = router;
