import client from './client';

export async function getProfile() {
  const response = await client.get('/profile/me');
  return response.data.profile;
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

export async function uploadPhoto(fileUri, mimeType) {
  const formData = new FormData();
  formData.append('photo', { uri: fileUri, type: mimeType || 'image/jpeg', name: 'photo.jpg' });
  const { data } = await client.post('/profile/me/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.photos;
}

export async function deletePhoto(index) {
  const { data } = await client.delete(`/profile/me/photos/${index}`);
  return data.photos;
}
