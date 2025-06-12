// frontend\components\shared\AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  // FileText,
  Trash2,
  // Users, 
  //Settings,
  Briefcase,
  // ShieldAlert,
  X,
  BarChart2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl'; 
import { useMemo } from 'react'; 

interface AdminNavItemDefinition {
  href: string;
  labelKey: string;
  icon: React.ElementType;
}

const baseNavItems: AdminNavItemDefinition[] = [
  { href: '/admin/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/containers', labelKey: 'containers', icon: Trash2 },
  { href: '/admin/stats', labelKey: 'statistics', icon: BarChart2 }, 
  { href: '/admin/operators', labelKey: 'operators', icon: Briefcase },
];

interface AdminSidebarProps {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AdminSidebar({ isMobileMenuOpen, setMobileMenuOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('AdminSidebar');
  const tNav = useTranslations('AdminSidebar.nav'); 

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
    <>
      {/* Overlay to close mobile menu */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50
          transform transition-transform duration-300
          w-full md:w-64
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:flex md:flex-col
          flex-shrink-0
        `}
        aria-label={t('sidebarLabel')}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
          <Link href="/admin/dashboard" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
            <LayoutDashboard className="h-7 w-7 text-green-600" />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {t('mobileHeaderTitle')}
            </h1>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label={t('closeMenuButtonAriaLabel')}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* desktop logo */}
        <div className="hidden md:flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <LayoutDashboard className="h-7 w-7 text-green-600" />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {t('desktopHeaderTitle')}
            </h1>
          </Link>
        </div>


        <ScrollArea className="flex-1 p-4 md:p-0">
          <nav className="md:p-4">
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const itemPathWithoutLocale = stripLocaleFromPath(item.href);
                const isActive =
                  currentPathWithoutLocale === itemPathWithoutLocale ||
                  (itemPathWithoutLocale !== '/admin/dashboard' && currentPathWithoutLocale.startsWith(itemPathWithoutLocale));

                return (
                  <li key={item.label}> 
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group
                        ${
                          isActive
                            ? 'bg-green-600 text-white shadow-sm hover:bg-green-600/90'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                        }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </ScrollArea>

        <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('footerText', { version: '1.0' })}
          </p>
        </div>
      </aside>
    </>
  );
}