// frontend\app\[locale]\(public)\(auth)\recover-password\page.tsx
import RequestPasswordResetForm from '@/components/auth/RequestPasswordResetForm';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('RecoverPasswordPage.metadata');
  return {
    title: t('title'),
    description: t('description'), 
  };
}

export default async function RecoveryPasswordPage() {
  const t = await getTranslations('RecoverPasswordPage.content');

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-white to-muted px-4">
      <div className="w-full max-w-md bg-primary-foreground border border-border rounded-2xl shadow-lg p-8 space-y-6 my-16">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-primary mb-2">{t('title')}</h1>
          <p className="text-sm text-secondary-foreground">
            {t('subtitle')}
          </p>
        </div>

        <RequestPasswordResetForm />

        <p className="text-xs text-center text-muted-foreground pt-4">
          {t('footerNote')}
        </p>
      </div>
    </div>
  );
}