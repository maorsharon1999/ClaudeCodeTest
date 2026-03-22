import client from './client';

export async function createBubble({ title, category, description, duration_h, lat, lng, shape_type, radius_m, shape_coords }) {
  const res = await client.post('/bubbles', {
    title, category, description, duration_h, lat, lng,
    shape_type, radius_m, shape_coords,
  });
  return res.data.bubble;
}

export async function getNearbyBubbles(lat, lng) {
  const res = await client.get('/bubbles/nearby', { params: { lat, lng } });
  return res.data.bubbles;
}

export async function getBubble(id) {
  const res = await client.get(`/bubbles/${id}`);
  return res.data.bubble;
}

export async function joinBubble(id) {
  const res = await client.post(`/bubbles/${id}/join`);
  return res.data.member;
}

export async function leaveBubble(id) {
  const res = await client.post(`/bubbles/${id}/leave`);
  return res.data.left;
}

export async function getBubbleMembers(id) {
  const res = await client.get(`/bubbles/${id}/members`);
  return res.data.members;
}

export async function sendBubbleMessage(id, body) {
  const res = await client.post(`/bubbles/${id}/messages`, { body });
  return res.data.message;
}

export async function getBubbleMessages(id, { before, limit } = {}) {
  const params = {};
  if (before) params.before = before;
  if (limit) params.limit = limit;
  const res = await client.get(`/bubbles/${id}/messages`, { params });
  return res.data.messages;
}

export async function closeBubble(id) {
  const res = await client.post(`/bubbles/${id}/close`);
  return res.data.closed;
}

export async function reportBubble(id, reason) {
  const res = await client.post(`/bubbles/${id}/report`, { reason });
  return res.data.reported;
}
