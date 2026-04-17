import client from './client';

export async function createSpatialMessage({ content, lat, lng, visibility_type, target_user_ids }) {
  const res = await client.post('/spatial-messages', {
    content,
    lat,
    lng,
    visibility_type: visibility_type || 'public',
    target_user_ids: target_user_ids || [],
  });
  return res.data.message;
}

export async function getNearbySpatialMessages(lat, lng) {
  const res = await client.get('/spatial-messages/nearby', {
    params: { lat, lng },
  });
  return res.data.messages || [];
}
