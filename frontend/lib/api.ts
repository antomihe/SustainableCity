// frontend\lib\api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSessionToken } from './actions';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error("La variable de entorno NEXT_PUBLIC_API_BASE_URL no está definida. Revisa tu .env.local");
}

interface PublicApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: InternalAxiosRequestConfig;
  request?: any;
}

interface PublicApiError {
  response?: PublicApiResponse;
  message: string;
  [key: string]: any;
}

type ApiType = 'public' | 'authorized';

const createResponseInterceptor = (apiType: ApiType) => {
  return (response: PublicApiResponse) => response;
};

const createErrorInterceptor = (apiType: ApiType) => {
  return (error: PublicApiError) => {
    const errorData = error.response?.data;
    const errorMessage =
      typeof errorData === 'object' && errorData !== null && 'message' in errorData
        ? errorData.message
        : error.message;
    console.error(`Error en la respuesta de la API ${apiType}:`, errorMessage, error.response?.status ? `(Status: ${error.response.status})` : '');
    if (error.response?.data) {
      console.error('Data:', error.response.data);
    }
    return Promise.reject(error);
  };
};

export const getPublicApiInstance = (locale?: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(locale && { 'Accept-Language': locale }),
    },
  });

  instance.interceptors.response.use(
    createResponseInterceptor('public'),
    createErrorInterceptor('public')
  );

  return instance;
};

export const createAuthorizedApi = async (locale?: string): Promise<AxiosInstance> => {
  const token = await getSessionToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(locale && { 'Accept-Language': locale }),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const instance = axios.create({
    baseURL,
    headers,
  });

  instance.interceptors.response.use(
    createResponseInterceptor('authorized'),
    createErrorInterceptor('authorized')
  );

  return instance;
};
