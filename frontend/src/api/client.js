import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injected by AuthContext after init
let _getAccessToken = null;
let _refreshAccessToken = null;
let _onAuthFailure = null;

export function configureInterceptors({ getAccessToken, refreshAccessToken, onAuthFailure }) {
  _getAccessToken = getAccessToken;
  _refreshAccessToken = refreshAccessToken;
  _onAuthFailure = onAuthFailure;
}

// Request interceptor: attach bearer token when available
client.interceptors.request.use((config) => {
  if (_getAccessToken) {
    const token = _getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Track if a refresh is already in-flight to avoid loops
let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
}

// Response interceptor: on 401 attempt one refresh then retry
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (_refreshAccessToken) {
          const newToken = await _refreshAccessToken();
          flushQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        flushQueue(refreshError, null);
        if (_onAuthFailure) _onAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
