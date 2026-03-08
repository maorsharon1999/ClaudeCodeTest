import client from './client';

export async function sendSignal(recipientId) {
  const res = await client.post('/signals', { recipient_id: recipientId });
  return res.data.signal;
}

export async function respondSignal(signalId, action) {
  const res = await client.put(`/signals/${signalId}`, { action });
  return res.data.signal;
}

export async function getIncomingSignals() {
  const res = await client.get('/signals/incoming');
  return res.data.signals;
}

export async function getOutgoingSignals() {
  const res = await client.get('/signals/outgoing');
  return res.data.signals;
}
