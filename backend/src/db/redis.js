'use strict';
const { createClient } = require('redis');

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => {
  console.error('Redis client error:', err.message);
});

async function getRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

module.exports = { getRedis };
