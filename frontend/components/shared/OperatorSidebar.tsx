// frontend\components\shared\OperatorSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ListChecks,
  FileDown,
  Wrench,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl'; 
import { useMemo } from 'react'; 

interface OperatorNavItemDefinition {
  href: string;
  labelKey: string; 
  icon: React.ElementType;
}


const baseNavItems: OperatorNavItemDefinition[] = [
  { href: '/operator/tasks', labelKey: 'myTasks', icon: ListChecks },
  { href: '/operator/tasks/pdf', labelKey: 'downloadTasksPdf', icon: FileDown },
];

export default function OperatorSidebar() {
  const pathname = usePathname();
  const t = useTranslations('OperatorSidebar');
  const tNav = useTranslations('OperatorSidebar.nav'); 

  
  const navItems = useMemo(() =>
    baseNavItems.map(item => ({
      ...item,
      label: tNav(item.labelKey as any), 
    })),
    [tNav] 
  );

  
  const stripLocaleFromPath = (path: string) => {
    const segments = path.split('/');
    if (segments.length > 1 && (segments[1] === 'en' || segments[1] === 'es')) { 
      return '/' + segments.slice(2).join('/');
    }
    return path;
  };
  const currentPathWithoutLocale = stripLocaleFromPath(pathname);

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
           aria-label={t('sidebarLabel')} 
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Link href="/operator/tasks" className="flex items-center space-x-2">
          <Wrench className="h-7 w-7 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            {t('headerTitle')}
          </h1>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-4">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const itemPathWithoutLocale = stripLocaleFromPath(item.href);
              const isActive =
                currentPathWithoutLocale === itemPathWithoutLocale ||
                (itemPathWithoutLocale !== '/operator/tasks' && currentPathWithoutLocale.startsWith(itemPathWithoutLocale)); 

              return (
                <li key={item.label}> 
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group
                      ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-600/90'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                      }`}
                  >
                    <item.icon className={`h-5 w-5
                      ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('footerText', { version: '1.0' })}
        </p>
      </div>
    </aside>
  );
}