// frontend\components\auth\RequestPasswordResetForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { getPublicApiInstance } from '@/lib/api'; 

export default function RequestPasswordResetForm() {
  const t = useTranslations('RequestPasswordResetForm');

  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(''); 

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const api = getPublicApiInstance(locale);
      await api.post('/auth/request-password-action', { email });
      toast.success(t('toast.success.requestSent'));
      setMessage(t('uiMessage.success.checkEmail')); 
      setEmail('');
    } catch (error: any) {
      console.error('Request password reset failed:', error);
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
          autoComplete="email"
          required
          placeholder={t('emailPlaceholder')}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('loadingButton') : t('submitButton')}
      </Button>
      {message && (
        
        <p className={`text-sm text-center mt-4 ${message.startsWith(t('uiMessage.success.checkEmail').substring(0,10)) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} transition-colors`}>
          {message}
        </p>
      )}
    </form>
  );
}