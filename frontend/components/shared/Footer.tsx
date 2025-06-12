// frontend\components\shared\Footer.tsx
'use client';

import Link from 'next/link';
import { Leaf, Mail } from 'lucide-react';
import { SiLinkedin, SiX, SiGithub } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useTransition } from 'react';
import { getPublicApiInstance } from '@/lib/api';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');

  const locale = useLocale(); 
  
  const [email, setEmail] = useState('');
  const [isSubmitting, startTransition] = useTransition();
  const currentYear = new Date().getFullYear();
  
  const handleSubscriptionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error(t('subscription.toast.error.emailRequired'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error(t('subscription.toast.error.invalidEmail'));
      return;
    }
    
    startTransition(async () => {
      try {
        const api = getPublicApiInstance(locale);
        await api.post('/subscriptions/subscribe', { email: email.trim() });
        toast.success(t('subscription.toast.success.title'), {
          description: t('subscription.toast.success.description'),
        });
        setEmail('');
      } catch (error: any) {
        const backendMessage = error.response?.data?.message;
        toast.error(backendMessage || t('subscription.toast.error.generic'));
      }
    });
  };

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 text-xl font-semibold text-green-600 dark:text-green-500">
              <Leaf className="h-7 w-7" />
              <span>{t('appName')}</span>
            </Link>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{t('appDescription')}</p>
              <br />
              <p>
                {t('devName')} <br />
                {t('appInfo')}
              </p>
            </div>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {t('subscription.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('subscription.description')}
            </p>
            <form onSubmit={handleSubscriptionSubmit} className="flex flex-col sm:flex-row gap-2">
              <Label htmlFor="footer-email-subscribe" className="sr-only">
                {t('subscription.emailLabel')}
              </Label>
              <Input
                id="footer-email-subscribe"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('subscription.emailPlaceholder')}
                required
                className="flex-grow bg-white dark:bg-gray-800"
                disabled={isSubmitting}
                aria-label={t('subscription.emailLabel')} 
              />
              <Button type="submit" variant="default" className="bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" aria-hidden="true"></span>
                ) : (
                  <Mail className="h-4 w-4 mr-0 sm:mr-2" aria-hidden="true" />
                )}
                <span className={isSubmitting ? "" : "hidden sm:inline"}>
                  {isSubmitting ? t('subscription.submittingButton') : t('subscription.submitButton')}
                </span>
              </Button>
            </form>
          </div>

          <div className="space-y-3 md:text-right">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 hidden md:block">
              {t('socials.title')}
            </h3>
            <div className="flex space-x-4 md:justify-end">
              <Link href="#" className="text-gray-500 hover:text-green-600 dark:hover:text-green-500 transition-colors" aria-label={t('socials.githubAriaLabel')}>
                <SiGithub className="h-7 w-7" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-green-600 dark:hover:text-green-500 transition-colors" aria-label={t('socials.linkedinAriaLabel')}>
                <SiLinkedin className="h-7 w-7" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-green-600 dark:hover:text-green-500 transition-colors" aria-label={t('socials.xAriaLabel')}>
                <SiX className="h-7 w-7" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('copyright', { year: currentYear, appName: t('appName'), devName: t('devName') })}
          </p>
        </div>
      </div>
    </footer>
  );
}