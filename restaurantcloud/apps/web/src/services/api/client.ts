import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Si falla 401 en una ruta protegida (y no es intento de login ni refresh)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          if (res.data?.exito && res.data?.datos?.token) {
            const nuevoToken = res.data.datos.token;
            localStorage.setItem('auth_token', nuevoToken);
            if (res.data.datos.refresh_token) {
              localStorage.setItem('refresh_token', res.data.datos.refresh_token);
            }
            originalRequest.headers.Authorization = `Bearer ${nuevoToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
      } else {
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);


export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params, ...config });
  return response.data;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
  return response.data;
}

