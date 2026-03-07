'use strict';
const { createClient } = require('redis');

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => {
  console.error('Redis client error:', err.message);
});

let connected = false;

async function getRedis() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client;
}

module.exports = { getRedis };
