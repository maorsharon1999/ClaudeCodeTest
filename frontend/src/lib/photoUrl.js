'use strict';

/**
 * Resolve a raw photo URL stored in the DB (which may contain localhost)
 * to a URL reachable from the device, using the configured API base.
 */
export function resolvePhotoUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  const apiBase = process.env.EXPO_PUBLIC_API_URL || '';
  const host = apiBase ? apiBase.replace('/api/v1', '') : '';
  return host ? rawUrl.replace(/^http:\/\/localhost:\d+/, host) : rawUrl;
}
