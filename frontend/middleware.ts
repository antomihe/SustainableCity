// frontend\middleware.ts


import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/types';
import createIntlMiddleware from 'next-intl/middleware';


import { routing } from './app/i18n/routing';

const AUTH_COOKIE_NAME = 'session_token';
const USER_COOKIE_NAME = 'current_user';


function authenticationMiddleware(request: NextRequest): NextResponse | undefined {
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const userCookie = request.cookies.get(USER_COOKIE_NAME)?.value;


  const { pathname: canonicalPathname } = request.nextUrl;


  const originalUrlForRedirectParam = request.headers.get('x-next-intl-original-url') || request.url;

  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch (e) { }
  }


  const loginPath = '/login';
  const adminBasePath = '/admin';
  const adminDashboardPath = '/admin/dashboard';
  const operatorBasePath = '/operator';
  const operatorTasksPath = '/operator/tasks';
  const rootPath = '/';


  if (sessionToken && user && canonicalPathname === loginPath) {
    let redirectPath = rootPath;
    if (user.role === UserRole.Admin) {
      redirectPath = adminDashboardPath;
    } else if (user.role === UserRole.Operator) {
      redirectPath = operatorTasksPath;
    }
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }


  if (canonicalPathname.startsWith(adminBasePath)) {
    if (!sessionToken || !user || user.role !== UserRole.Admin) {
      const loginRedirectUrl = new URL(loginPath, request.url);
      loginRedirectUrl.searchParams.set('redirect', originalUrlForRedirectParam);
      return NextResponse.redirect(loginRedirectUrl);
    }
  }


  if (canonicalPathname.startsWith(operatorBasePath)) {
    if (!sessionToken || !user || user.role !== UserRole.Operator) {
      const loginRedirectUrl = new URL(loginPath, request.url);
      loginRedirectUrl.searchParams.set('redirect', originalUrlForRedirectParam);
      return NextResponse.redirect(loginRedirectUrl);
    }
  }

  return undefined;
}


export default async function middleware(request: NextRequest) {
  if (!request.headers.has('x-next-intl-original-url')) {
    request.headers.set('x-next-intl-original-url', request.url);
  }

  const { locales, defaultLocale, localePrefix } = routing;

  const handleI18nRouting = createIntlMiddleware({
    locales,
    defaultLocale,
    localePrefix: localePrefix || 'as-needed',
  });

  const i18nResponse = handleI18nRouting(request);


  if (i18nResponse.headers.get('x-middleware-rewrite') || (i18nResponse.status >= 300 && i18nResponse.status < 400)) {
    return i18nResponse;
  }

  const authResponse = authenticationMiddleware(request);

  if (authResponse) {
    return authResponse;
  }

  return i18nResponse;
}


export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|workbox-.*.js).*)'
  ],
};