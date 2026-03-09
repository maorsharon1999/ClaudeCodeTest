import client from './client';

export async function getThreads() {
  const res = await client.get('/threads');
  return res.data.threads;
}

export async function getMessages(threadId) {
  const res = await client.get(`/threads/${threadId}/messages`);
  return res.data.messages;
}

export async function sendMessage(threadId, body) {
  const res = await client.post(`/threads/${threadId}/messages`, { body });
  return res.data.message;
}

export async function blockUser(blockedId) {
  const res = await client.post('/blocks', { blocked_id: blockedId });
  return res.data;
}

export async function reportUser(reportedId, reason) {
  const res = await client.post('/reports', { reported_id: reportedId, reason });
  return res.data;
}
