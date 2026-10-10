import axios from 'axios';
import type { ApiResponse } from '../types/api';

// ─── Token Management ───────────────────────────────────────
const TOKEN_KEY = 'atelier_access_token';
const REFRESH_KEY = 'atelier_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Config ─────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL as string;
export const API_BASE_URL = `${BASE_URL}/api/v1`;

// ─── Axios Instance ─────────────────────────────────────────
const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Refresh Logic ──────────────────────────────────────────
let refreshPromise: Promise<string> | null = null;

async function executeTokenRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    throw new ApiRequestError(401, 'Sesi telah berakhir. Silakan login kembali.');
  }

  try {
    const { data: body } = await axios.post<
      ApiResponse<{ access_token: string; refresh_token: string }>
    >(`${API_BASE_URL}/auth/refresh`, { refreshToken });

    const { access_token, refresh_token: newRefresh } = body.data;
    setTokens(access_token, newRefresh);
    return access_token;
  } catch {
    clearTokens();
    throw new ApiRequestError(401, 'Sesi telah berakhir. Silakan login kembali.');
  }
}

// ─── Request Interceptor: attach Bearer token ───────────────
http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor: unwrap envelope + handle 401 ─────
http.interceptors.response.use(
  (response) => {
    // Only unwrap if the response is an ApiResponse envelope: { success, data, ... }
    const body = response.data;
    if (
      body &&
      typeof body === 'object' &&
      'success' in body &&
      'data' in body
    ) {
      response.data = (body as ApiResponse<unknown>).data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If not a 401 or no request config, reject immediately
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(wrapError(error));
    }

    // Skip refresh for auth endpoints that naturally return 401
    const requestUrl = originalRequest.url || '';
    if (
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/google/exchange')
    ) {
      clearTokens();
      return Promise.reject(wrapError(error));
    }

    // Skip if already retrying (prevent infinite retry loop)
    if (originalRequest._retry) {
      return Promise.reject(wrapError(error));
    }

    // Skip if no refresh token available
    if (!getRefreshToken()) {
      clearTokens();
      return Promise.reject(
        new ApiRequestError(401, 'Sesi telah berakhir. Silakan login kembali.'),
      );
    }

    originalRequest._retry = true;

    // Shared promise: ensure single in-flight refresh call across concurrent requests
    if (!refreshPromise) {
      refreshPromise = executeTokenRefresh().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newToken = await refreshPromise;
      if (!newToken) {
        throw new ApiRequestError(401, 'Sesi telah berakhir. Silakan login kembali.');
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return http(originalRequest);
    } catch (refreshErr) {
      return Promise.reject(
        refreshErr instanceof ApiRequestError
          ? refreshErr
          : new ApiRequestError(401, 'Sesi telah berakhir. Silakan login kembali.'),
      );
    }
  },
);

// ─── Error Helper ───────────────────────────────────────────
function wrapError(error: unknown): ApiRequestError {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { message?: string | string[] } | undefined;
    const message = Array.isArray(data?.message)
      ? data!.message.join(', ')
      : data?.message || 'Terjadi kesalahan';
    return new ApiRequestError(error.response.status, message);
  }
  if (error instanceof ApiRequestError) return error;
  return new ApiRequestError(0, 'Terjadi kesalahan jaringan');
}

// ─── Error Class ────────────────────────────────────────────
export class ApiRequestError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiRequestError';
  }
}

// ─── Convenience Methods ────────────────────────────────────
export const api = {
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const filteredParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null && v !== '',
          ),
        )
      : undefined;
    const { data } = await http.get<T>(endpoint, { params: filteredParams });
    return data;
  },

  async post<T>(endpoint: string, body?: unknown, config?: { headers?: Record<string, string> }): Promise<T> {
    const { data } = await http.post<T>(endpoint, body, config as unknown as Parameters<typeof http.post>[2]);
    return data;
  },

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const { data } = await http.patch<T>(endpoint, body);
    return data;
  },

  async delete<T>(endpoint: string): Promise<T> {
    const { data } = await http.delete<T>(endpoint);
    return data;
  },

  async getBlob(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<{ blob: Blob; filename?: string }> {
    const filteredParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null && v !== '',
          ),
        )
      : undefined;
    const response = await http.get<Blob>(endpoint, {
      params: filteredParams,
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] as
      | string
      | undefined;
    let filename: string | undefined;
    if (disposition) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match?.[1]) filename = match[1];
    }

    return { blob: response.data, filename };
  },
};
