'use strict';
require('dotenv').config();

// Config must load after dotenv
const config = require('./config');
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes       = require('./routes/auth');
const profileRoutes    = require('./routes/profile');
const visibilityRoutes = require('./routes/visibility');
const locationRoutes   = require('./routes/location');
const discoveryRoutes  = require('./routes/discovery');
const signalRoutes     = require('./routes/signals');
const threadsRoutes    = require('./routes/threads');
const voiceRoutes      = require('./routes/voice');
const blocksRoutes     = require('./routes/blocks');
const reportsRoutes    = require('./routes/reports');
const internalRoutes   = require('./routes/internal');
const { errorHandler } = require('./middleware/errorHandler');
const pool             = require('./db/pool');

// Ensure voice upload directory exists
require('fs').mkdirSync(path.join(__dirname, '..', 'uploads', 'voice'), { recursive: true });

const app = express();

app.use(cors());
app.use(express.json());
// Profile photos are served publicly (acceptable for MVP); voice notes require auth (see /voice-notes route)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// API routes
app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/profile',    profileRoutes);
app.use('/api/v1/visibility', visibilityRoutes);
app.use('/api/v1/location',   locationRoutes);
app.use('/api/v1/discovery',  discoveryRoutes);
app.use('/api/v1/signals',    signalRoutes);
app.use('/api/v1/threads',   threadsRoutes);
app.use('/voice-notes',      voiceRoutes);
app.use('/api/v1/blocks',    blocksRoutes);
app.use('/api/v1/reports',   reportsRoutes);
app.use('/internal',         internalRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

// Global error handler
app.use(errorHandler);

if (require.main === module) {
  const startupCheck = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('DB health check timed out after 5s')), 5000);
    pool.query('SELECT 1').then(() => { clearTimeout(t); resolve(); }).catch(reject);
  });
  startupCheck
    .then(() => {
      app.listen(config.port, () => {
        console.log(`Bubble backend listening on port ${config.port} [${config.nodeEnv}]`);
      });
    })
    .catch(err => {
      console.error('Startup failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
