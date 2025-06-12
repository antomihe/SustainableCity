// frontend\app\[locale]\(public)\(auth)\login\page.tsx
import LoginForm from '@/components/auth/LoginForm';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';


export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('LoginPage.metadata');
  return {
    title: t('title'),
    description: t('description'), 
  };
}

export default async function LoginPage() {
  const t = await getTranslations('LoginPage.content'); 

  return (
    <div className="flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md p-8 bg-primary-foreground shadow-lg rounded-2xl border border-border my-16">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-primary">
          {t('title')}
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          {t('subtitle')}
        </p>
        <LoginForm />
        <p className="text-center text-xs mt-6 text-muted-foreground italic">
          {t('footerNote')}
        </p>
      </div>
    </div>
  );
}