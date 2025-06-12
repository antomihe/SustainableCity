// frontend\components\custom\map\ContainerMapWrapper.tsx

'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl'; 

const LoadingMapMessage = () => {
  const t = useTranslations('ContainerMapWrapper'); 
  return (
    <div className="h-[500px] w-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded-md animate-pulse">
      <p className="text-muted-foreground">{t('loadingMap')}</p>
    </div>
  );
};

const ContainerMap = dynamic(() => import('./ContainerMap'), {
  ssr: false,
  loading: () => <LoadingMapMessage />, 
});

export default function ContainerMapWrapper() {
  return <ContainerMap />; 
}