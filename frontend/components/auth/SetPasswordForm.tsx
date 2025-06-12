// frontend\components\auth\SetPasswordForm.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPublicApiInstance } from '@/lib/api';
import { AuthData } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

interface SetPasswordFormProps {
  token: string;
}

export default function SetPasswordForm({ token }: SetPasswordFormProps) {
  const t = useTranslations('SetPasswordForm');

  const locale = useLocale();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('toast.error.passwordsDoNotMatch'));
      return;
    }
    if (password.length < 6) { 
      toast.error(t('toast.error.passwordTooShort', { minLength: 6 }));
      return;
    }

    setIsLoading(true);
    try {
      const api = getPublicApiInstance(locale);
      const response = await api.post<AuthData>('/auth/set-new-password', { token, newPassword: password });
      toast.success(t('toast.success.passwordSetAndLoggedIn'));
      await login(response.data);
      router.refresh(); 
    } catch (error: any) {
      console.error('Password set failed:', error);
      const backendMessage = error.response?.data?.message;
      const errorMessage = backendMessage || t('toast.error.default');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-200 dark:border-zinc-800">
      <h1 className="text-2xl font-semibold text-center text-zinc-900 dark:text-white mb-4">
        {t('title')}
      </h1>

      <p className="mb-6 text-center text-sm italic text-zinc-500 dark:text-zinc-400 select-none">
        {t('securityTip')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="password">{t('newPasswordLabel')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            placeholder={t('passwordPlaceholder')}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password" 
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            required
            placeholder={t('passwordPlaceholder')}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('loadingButton') : t('submitButton')}
        </Button>
      </form>
    </div>
  );
}