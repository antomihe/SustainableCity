// frontend\app\[locale]\(public)\report-incident\page.tsx
import ReportIncidentFormCard from '@/components/custom/incident/ReportIncidentFormCard';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ReportIncidentPage.metadata');

  return {
    title: t('title'),
    description: t('description'),
  };
}

function ReportIncidentPageContent() {
  const t = useTranslations('ReportIncidentPage.content');

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
      <header className="text-center mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
          {t('title')}
        </h1>
        <p className="mt-2 text-md md:text-lg text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </header>

      <ReportIncidentFormCard />

      <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          {t('anonymityNote')}
        </p>
        <p>
          {t('thankYouNote')}
        </p>
      </div>
    </div>
  );
}


export default function ReportIncidentPage() {
  const t = useTranslations('ReportIncidentPage.content');

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">{t('loadingForm')}</div>}>
      <div className="container mx-auto py-8 max-w-2xl">
        <ReportIncidentPageContent />
      </div>
    </Suspense>
  );
}