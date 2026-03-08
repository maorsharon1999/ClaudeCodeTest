'use strict';
require('dotenv').config();

// Config must load after dotenv
const config = require('./config');
const express = require('express');

const authRoutes       = require('./routes/auth');
const profileRoutes    = require('./routes/profile');
const visibilityRoutes = require('./routes/visibility');
const locationRoutes   = require('./routes/location');
const discoveryRoutes  = require('./routes/discovery');
const signalRoutes     = require('./routes/signals');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// API routes
app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/profile',    profileRoutes);
app.use('/api/v1/visibility', visibilityRoutes);
app.use('/api/v1/location',   locationRoutes);
app.use('/api/v1/discovery',  discoveryRoutes);
app.use('/api/v1/signals',    signalRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

// Global error handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Bubble backend listening on port ${config.port} [${config.nodeEnv}]`);
  });
}

module.exports = app;
