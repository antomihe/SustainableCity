// frontend\lib\actions.ts
'use server';

import { cookies } from 'next/headers';
import { AuthData, User } from './types';

const AUTH_COOKIE_NAME = 'session_token';
const USER_COOKIE_NAME = 'current_user';

export async function loginUserAction(authData: AuthData) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, authData.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60, // 1 hora (igual que el JWT del backend)
    path: '/',
    sameSite: 'lax',
  });
  cookieStore.set(USER_COOKIE_NAME, JSON.stringify(authData.user), {
    // No httpOnly para que pueda ser leído por el cliente para UI
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60,
    path: '/',
    sameSite: 'lax',
  });
}

export async function logoutUserAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(USER_COOKIE_NAME);
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value;
  if (userCookie) {
    try {
      return JSON.parse(userCookie) as User;
    } catch (error) {
      console.error('Error parsing user cookie:', error);
      return null;
    }
  }
  return null;
}