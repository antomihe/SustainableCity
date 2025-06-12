// frontend\app\[locale]\(public)\page.tsx
import ContainerMapWrapper from '@/components/custom/map/ContainerMapWrapper';
import { H2 } from '@/components/ui/typography'; 
import { SocketProvider } from '@/contexts/SocketContext';
import { VelocityScroll } from '@/components/magicui/scroll-based-velocity';
import { PointerHighlight } from '@/components/ui/pointer-highlight';
import { getLocale, getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations('HomePage');

  return {
    title: `${t('campusNamePrefix')} ${t('campusNameSuffixSustainable')}`,
    description: t('subtitle'),
    authors: [{ name: 'Antonio Miguel Herrero' }],
    creator: 'Antonio Miguel Herrero',
    applicationName: `${t('campusNamePrefix')} ${t('campusNameSuffixSustainable')}`,
    colorScheme: 'light dark',
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#f0fdf4' }, // light mode
      { media: '(prefers-color-scheme: dark)', color: '#065f46' }, // dark mode
    ],
    keywords: ['campus', 'sustainable', 'green', 'map', 'innovation'],
    openGraph: {
      title: `${t('campusNamePrefix')} ${t('campusNameSuffixSustainable')}`,
      description: t('subtitle'),
      type: 'website',
      locale: await getLocale(),
    },
  };
};

export default async function HomePage() {
  const t = await getTranslations('HomePage');

  return (
    <SocketProvider namespace="containers">
      <header className="text-center mx-4 px-4 sm:px-6 lg:px-8">
        <div className="relative w-full rounded-lg">
          <div className="mx-auto max-w-lg my-10 font-bold tracking-tight md:text-4xl flex items-center justify-center">
            <span className='text-7xl text-green-600'>{t('campusNamePrefix')} </span>
            <PointerHighlight
              rectangleClassName="bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600"
              pointerClassName="text-green-600"
              reinitializeTime={5000}
            >
              <span className="relative z-10 text-7xl">{t('campusNameSuffixSustainable')}</span>
            </PointerHighlight>
          </div>
        </div>

        <H2 className="text-primary mt-3 text-lg sm:text-xl md:text-2xl font-semibold">
          {t('subtitle')}
        </H2>

        <p className="text-sm text-secondary-foreground italic mt-1 select-none" >
          {t('tagline')}
          <strong>
            {t('taglineHighlight')}
          </strong>
        </p>

      </header>

      <main className="container mx-auto px-6 sm:px-12 lg:px-24 py-10 min-h-[60vh]">
        <ContainerMapWrapper />
      </main>

      <footer className="bg-green-50 dark:bg-green-950 py-4 sm:py-6 mt-12">
        <VelocityScroll
          className="text-green-700 dark:text-lime-400 text-sm sm:text-base font-semibold tracking-wide uppercase text-center select-none"
          numRows={1}
          defaultVelocity={0.5}
        >
          ♻️ REDUCE, 🔄 REUSE, 🛠️ REFACTOR,
        </VelocityScroll>
      </footer>

    </SocketProvider>
  );
}