import client from './client';

export async function getThreads() {
  const res = await client.get('/threads');
  return res.data.threads;
}

export async function getMessages(threadId, { before, limit } = {}) {
  const params = {};
  if (before) params.before = before;
  if (limit) params.limit = limit;
  const res = await client.get(`/threads/${threadId}/messages`, { params });
  return { messages: res.data.messages, has_more: res.data.has_more };
}

export async function sendMessage(threadId, body) {
  const res = await client.post(`/threads/${threadId}/messages`, { body });
  return res.data.message;
}

export async function uploadVoiceNote(threadId, fileUri, durationS) {
  const formData = new FormData();
  formData.append('audio', { uri: fileUri, type: 'audio/m4a', name: 'voice.m4a' });
  formData.append('duration_s', String(durationS));
  const { data } = await client.post(`/threads/${threadId}/voice-notes`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.message;
}

export async function blockUser(blockedId) {
  const res = await client.post('/blocks', { blocked_id: blockedId });
  return res.data;
}

export async function reportUser(reportedId, reason) {
  const res = await client.post('/reports', { reported_id: reportedId, reason });
  return res.data;
}
