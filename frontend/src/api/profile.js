import client from './client';

export async function getProfile() {
  const response = await client.get('/profile/me');
  return response.data;
}

export async function updateProfile(data) {
  const response = await client.put('/profile/me', data);
  return response.data;
}

export async function getVisibility() {
  const response = await client.get('/visibility/me');
  return response.data;
}

export async function setVisibility(state) {
  const response = await client.put('/visibility/me', { state });
  return response.data;
}
