const axios = require('axios');

const BASE_URL = process.env.XTREAM_BASE_URL;
const USERNAME = process.env.XTREAM_USERNAME;
const PASSWORD = process.env.XTREAM_PASSWORD;

function apiUrl(action, extraParams = {}) {
  const params = new URLSearchParams({
    username: USERNAME,
    password: PASSWORD,
    action,
    ...extraParams,
  });
  return `${BASE_URL}/player_api.php?${params.toString()}`;
}

async function call(action, extraParams = {}) {
  const { data } = await axios.get(apiUrl(action, extraParams), { timeout: 15000 });
  return data;
}

const xtream = {
  // ── Autenticación / info de cuenta ──
  getAccountInfo: () => call(''),

  // ── En Vivo ──
  getLiveCategories: () => call('get_live_categories'),
  getLiveStreams: (categoryId) => call('get_live_streams', categoryId ? { category_id: categoryId } : {}),
  getShortEpg: (streamId, limit = 4) => call('get_short_epg', { stream_id: streamId, limit }),

  // ── Películas (VOD) ──
  getVodCategories: () => call('get_vod_categories'),
  getVodStreams: (categoryId) => call('get_vod_streams', categoryId ? { category_id: categoryId } : {}),
  getVodInfo: (vodId) => call('get_vod_info', { vod_id: vodId }),

  // ── Series ──
  getSeriesCategories: () => call('get_series_categories'),
  getSeries: (categoryId) => call('get_series', categoryId ? { category_id: categoryId } : {}),
  getSeriesInfo: (seriesId) => call('get_series_info', { series_id: seriesId }),

  // ── URLs de reproducción ──
  liveStreamUrl: (streamId, ext = 'm3u8') => `${BASE_URL}/live/${USERNAME}/${PASSWORD}/${streamId}.${ext}`,
  vodStreamUrl: (streamId, ext) => `${BASE_URL}/movie/${USERNAME}/${PASSWORD}/${streamId}.${ext}`,
  seriesEpisodeUrl: (episodeId, ext) => `${BASE_URL}/series/${USERNAME}/${PASSWORD}/${episodeId}.${ext}`,
};

module.exports = xtream;
