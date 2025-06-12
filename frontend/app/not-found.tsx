// frontend\app\not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('NotFoundPage.metadata' );
  return {
    title: t('title'),
  };
}

export default async function NotFoundPage() {
  const t = await getTranslations('NotFoundPage.content');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-background text-foreground">
      <div className="max-w-2xl w-full">
        <FileQuestion
          className="mx-auto h-24 w-24 text-green-500 dark:text-green-600 mb-8 animate-bounce"
          strokeWidth={1.5}
        />

        <h1 className="text-5xl md:text-7xl font-bold text-green-600 dark:text-green-400 mb-4">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          {t('title')} ♻️
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8 text-base md:text-lg leading-relaxed">
          {t('description')}
          <br />
          {t('descriptionHighlight')}
        </p>

        <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              {t('goHomeButton')}
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/search">
              <Search className="mr-2 h-5 w-5" />
              {t('searchContainerButton')}
            </Link>
          </Button>
        </div>

        <p className="mt-12 text-xs text-gray-500 dark:text-gray-400">
          {t('tipOfTheDay')}
        </p>
      </div>
    </div>
  );
}