// frontend\components\auth\LoginForm.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPublicApiInstance } from '@/lib/api';
import { AuthData } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function LoginForm() {
  const t = useTranslations('LoginForm');

  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const api = getPublicApiInstance(locale);
      const response = await api.post<AuthData>('/auth/login', { email, password });
      await login(response.data);
      toast.success(t('toast.success.loggedIn'));
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) router.push(redirectUrl);
      router.refresh();
    } catch (error: any) {
      console.error('Login failed:', error);
      const backendMessage = error.response?.data?.message;
      const errorMessage = backendMessage || t('toast.error.default');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          autoComplete='email'
          required
          placeholder={t('emailPlaceholder')}
        />
      </div>
      <div>
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          autoComplete='current-password'
          required
          placeholder={t('passwordPlaceholder')}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('loadingButton') : t('submitButton')}
      </Button>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t('noAccountPrompt')}{' '}
          <Link href="/register" legacyBehavior>
            <a className="font-medium text-indigo-600 hover:text-indigo-500">
              {t('createAccountLink')}
            </a>
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          {t('forgotPasswordPrompt')}{' '}
          <Link href="/recover-password" legacyBehavior>
            <a className="font-medium text-indigo-600 hover:text-indigo-500">
              {t('recoverPasswordLink')}
            </a>
          </Link>
        </p>
      </div>
    </form>
  );
}