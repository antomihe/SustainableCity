// frontend\components\auth\RegisterForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPublicApiInstance } from '@/lib/api';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

export default function RegisterForm() {
  const t = useTranslations('RegisterForm');

  const locale = useLocale();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(''); 

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const api = getPublicApiInstance(locale);
      await api.post('/auth/register', { name, email });
      toast.success(t('toast.success.requestSent'));
      setMessage(t('uiMessage.success.checkEmail'));
      setName('');
      setEmail('');
    } catch (error: any) {
      console.error('Registration request failed:', error);
      const backendMessage = error.response?.data?.message;
      const errorMessage = backendMessage || t('toast.error.default');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          {t('nameLabel')}
        </Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          placeholder={t('namePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          {t('emailLabel')}
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t('emailPlaceholder')}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('loadingButton') : t('submitButton')}
      </Button>
      {message && (
        <p className={`text-center text-sm mt-4 ${message.startsWith('✅') || message.startsWith(t('uiMessage.success.checkEmail').substring(0,5)) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} transition-colors`}>
          {message}
        </p>
      )}
    </form>
  );
}