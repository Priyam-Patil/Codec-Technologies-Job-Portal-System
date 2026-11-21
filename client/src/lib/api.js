import axios from 'axios';

export const normalizeBackendUrl = value => String(value || '').trim().replace(/\/+$/, '');

function configurationError(message) {
  return Object.assign(new Error(message), { code: 'ERR_API_CONFIGURATION' });
}

export function validateBackendUrl(value, pageProtocol) {
  let url;
  try { url = new URL(normalizeBackendUrl(value)); }
  catch { throw configurationError('The API URL is missing or invalid. Configure VITE_BACKEND_URL manually and restart the frontend.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw configurationError('The API URL must be an HTTP or HTTPS service URL without credentials, query parameters or fragments.');
  }
  if (pageProtocol === 'https:' && url.protocol !== 'https:') throw configurationError('This HTTPS page requires an HTTPS API URL. Configure VITE_BACKEND_URL manually and restart the frontend.');
  return url;
}

export function describeApiError(error, online = true) {
  if (error.code === 'ERR_CANCELED' || error.code === 'ERR_API_CONFIGURATION') return error.message;
  if (error.response) {
    if (typeof error.response.data?.message === 'string') return error.response.data.message;
    const messages = { 401: 'Sign in again to continue.', 403: 'You do not have permission for this action.',
      404: 'The requested resource was not found.', 409: 'This action conflicts with an existing record.',
      413: 'The selected file is too large.', 422: 'Check the submitted information and try again.',
      429: 'Too many requests. Wait before trying again.', 503: 'The API is temporarily unavailable. Try again shortly.' };
    return messages[error.response.status] || 'The API could not complete this request. Try again.';
  }
  if (online === false) return 'You appear to be offline. Reconnect and retry.';
  if (['ECONNABORTED', 'ETIMEDOUT'].includes(error.code)) return 'The API did not respond in time. Try again.';
  if (error.request || error.code === 'ERR_NETWORK') return 'Cannot reach the API. Check that the backend is running and that its URL and allowed origin are correct, then retry.';
  return error.message || 'The request could not be completed. Try again.';
}

export function createApiClient({ baseUrl, pageProtocol, isOnline = () => true } = {}) {
  const client = axios.create({ timeout: 15000 });
  client.interceptors.request.use(config => {
    const base = validateBackendUrl(baseUrl, pageProtocol);
    const target = new URL(config.url, base.href);
    if (target.origin !== base.origin) throw configurationError('The request does not target the configured API service.');
    config.baseURL = normalizeBackendUrl(baseUrl);
    // Uploads include bounded parsing and an external storage round trip.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.timeout === 15000) config.timeout = 60000;
    return config;
  });
  client.interceptors.response.use(response => response, error => {
    error.message = describeApiError(error, isOnline());
    // Never log request headers, credentials, payloads, tokens or signed URLs.
    return Promise.reject(error);
  });
  return client;
}

const baseUrl = typeof window !== 'undefined' ? import.meta.env.VITE_BACKEND_URL : undefined;
export default createApiClient({ baseUrl, pageProtocol: typeof window !== 'undefined' ? window.location.protocol : undefined,
  isOnline: () => typeof navigator === 'undefined' || navigator.onLine !== false });
