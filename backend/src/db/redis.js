'use strict';
const { createClient } = require('redis');

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => {
  // Suppress empty-message noise from internal socket events
  if (err && err.message) {
    console.error('Redis client error:', err.message);
  }
});

// Cache the connect promise so concurrent callers don't race into connect()
let connectPromise = null;

async function getRedis() {
  if (client.isOpen) {
    return client;
  }
  if (!connectPromise) {
    connectPromise = client.connect().catch((err) => {
      // Reset so a future call can retry
      connectPromise = null;
      throw err;
    });
  }
  await connectPromise;
  return client;
}

module.exports = { getRedis };
