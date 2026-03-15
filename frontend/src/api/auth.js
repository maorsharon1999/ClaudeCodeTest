import client from './client';

export async function requestOtp(phone) {
  const response = await client.post('/auth/otp/request', { phone });
  return response.data; // { expires_in }
}

export async function verifyOtp(phone, code) {
  const response = await client.post('/auth/otp/verify', { phone, code });
  return response.data; // { access_token, refresh_token, user_id, profile_complete }
}

export async function refreshToken(refresh_token) {
  // Call without interceptors to avoid infinite loop — use raw axios config
  const response = await client.post(
    '/auth/token/refresh',
    { refresh_token },
    { _retry: true } // Prevent interceptor from retrying this call
  );
  return response.data; // { access_token }
}

export async function deleteSession(refresh_token) {
  await client.delete('/auth/session', { data: { refresh_token } });
}

export async function deleteAccount() {
  await client.delete('/auth/account');
}
