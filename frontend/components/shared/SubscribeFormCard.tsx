// frontend\components\shared\SubscribeFormCard.tsx
// frontend\components\custom\SubscribeFormCard.tsx

'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getPublicApiInstance } from '@/lib/api';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

export default function SubscribeFormCard() {
  const t = useTranslations('SubscribeFormCard');

  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [isSubmitting, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error(t('toast.error.emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error(t('toast.error.invalidEmail'));
      return;
    }

    startTransition(async () => {
      try {
        const api = getPublicApiInstance(locale);
        await api.post('/subscriptions/subscribe', { email: email.trim() });

        toast.success(t('toast.success.subscribedTitle'), {
          description: t('toast.success.subscribedDescription'),
        });
        setEmail('');
      } catch (error: any) {
        const backendMessage = error.response?.data?.message;
        toast.error(backendMessage || t('toast.error.genericError'));
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="email-subscribe">{t('emailLabel')}</Label>
            <Input
              id="email-subscribe"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('emailPlaceholder')}
              disabled={isSubmitting}
              aria-describedby="email-subscribe-description"
            />
            <p id="email-subscribe-description" className="text-xs text-muted-foreground">
              {t('privacyNote')}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('submittingButton') : t('submitButton')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}