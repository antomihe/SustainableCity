// frontend\components\custom\search\SearchLoadingComponents.tsx
'use client';

import { useTranslations } from 'next-intl';

export const LoadingMapResultsMessage = () => {
  const t = useTranslations('SearchClientPage.loading');
  return <div className="h-[400px] w-full bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center rounded-md"><p className="text-muted-foreground">{t('mapResults')}</p></div>;
};

export const LoadingMapSelectorMessage = () => {
  const t = useTranslations('SearchClientPage.loading');
  return <div className="h-[300px] w-full bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center rounded-md"><p className="text-muted-foreground">{t('mapSelector')}</p></div>;
};