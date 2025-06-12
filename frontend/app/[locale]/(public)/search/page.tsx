// frontend\app\[locale]\(public)\search\page.tsx
import SearchClientPage from "@/components/custom/search/SearchClientPage";
import { SocketProvider } from "@/contexts/SocketContext";
import { MapIcon } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from 'next-intl/server'; 

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SearchPage.metadata');

  return {
    title: t('title'),
    description: t('description'),
  };
}


export default async function SearchContainersPage() {
    const t = await getTranslations('SearchPage.content');

    return (
        <SocketProvider namespace="containers">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <header className="text-center mb-8 md:mb-10">
                    <MapIcon className="mx-auto h-16 w-16 text-green-600 dark:text-green-500 mb-4" />
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                        {t('title')}
                    </h1>
                    <p className="mt-2 text-md md:text-lg text-gray-600 dark:text-gray-400">
                        {t('subtitle')}
                    </p>
                </header>

                <SearchClientPage /> 
            </div>
        </SocketProvider>
    );
}