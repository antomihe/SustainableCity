// frontend\app\[locale]\(public)\(auth)\register\page.tsx
import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';


export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('RegisterPage.metadata');
  return {
    title: t('title'),
    description: t('description'), 
  };
}

export default async function RegisterPage() {
  const t = await getTranslations('RegisterPage.content');

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-white to-muted px-4">
      <div className="w-full max-w-md bg-primary-foreground border border-border rounded-2xl shadow-lg p-8 space-y-6 my-16">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-primary mb-2">{t('title')}</h1>
          <p className="text-sm text-secondary-foreground">
            {t('subtitle')}
          </p>
          <p className="text-sm mt-2 text-secondary-foreground">
            {t('alreadyHaveAccountPrompt')}{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              {t('loginLink')}
            </Link>
          </p>
        </div>

        <RegisterForm /> {/* Este componente también necesitará internacionalización */}

        <p className="text-xs text-center text-muted-foreground pt-4">
          {t('footerNote')}
        </p>
      </div>
    </div>
  );
}