import client from './client';

export async function updateLocation(lat, lng) {
  const res = await client.put('/location/me', { lat, lng });
  return res.data;
}

export async function getNearbyUsers() {
  const res = await client.get('/discovery/nearby');
  return res.data.users;
}
