require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const liveRoutes = require('./routes/live');
const vodRoutes = require('./routes/vod');
const adminRoutes = require('./routes/admin');
const bootstrapRoutes = require('./routes/bootstrap');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'maxtv-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/vod', vodRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bootstrap', bootstrapRoutes);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MaxTV backend corriendo en el puerto ${PORT}`));
