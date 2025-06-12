// frontend\components\shared\Header.tsx

'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, Menu as MenuIcon, Leaf, Home, Wrench, Settings, AlertTriangle, Search, LayoutDashboard, UserPlus2 } from 'lucide-react'; 
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { ThemeToggle } from '@/components/ui/themeToggle';
import LocaleSwitcher from '../client/LocaleSwitcher';
import { useTranslations } from 'next-intl';

interface NavItemDefinition {
  href: string;
  labelKey: string; 
  icon: React.ElementType;
  roles?: UserRole[];
  public?: boolean;
}


const baseNavItems: NavItemDefinition[] = [
  { href: '/', labelKey: 'homeMap', icon: Home, public: true },
  { href: '/admin/dashboard', labelKey: 'adminDashboard', icon: LayoutDashboard, roles: [UserRole.Admin] },
  { href: '/operator/tasks', labelKey: 'operatorTasks', icon: Wrench, roles: [UserRole.Operator] },
  { href: '/search', labelKey: 'searchContainers', icon: Search, public: true },
  { href: '/report-incident', labelKey: 'reportIncident', icon: AlertTriangle, public: true },
];

const stripLocaleFromPath = (path: string) => {
  const segments = path.split('/');
  
  if (segments.length > 1 && (segments[1] === 'en' || segments[1] === 'es')) {
    return '/' + segments.slice(2).join('/');
  }
  return path;
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const t = useTranslations('Header');
  const tNav = useTranslations('Header.nav'); 
  const tRoles = useTranslations('types.userRoles'); 
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = stripLocaleFromPath(path);

  
  const allNavItems = baseNavItems.map(item => ({
    ...item,
    label: tNav(item.labelKey), 
  }));

  const getVisibleNavItems = () => {
    if (isLoading) return [];
    if (isAuthenticated && user) {
      return allNavItems.filter(item => item.public || (item.roles && item.roles.includes(user.role)));
    }
    return allNavItems.filter(item => item.public);
  };

  const visibleNavItems = getVisibleNavItems();

  const handleLogout = async () => {
    await logout();
    
    
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  
  if (isLoading && !isAuthenticated && (pathname === '/login' || pathname === '/register' || pathname === '/recover-password' || pathname.startsWith('/set-password'))) {
    return null;
  }

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {visibleNavItems.map((item) => (
        <Link
          key={item.label} 
          href={item.href}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${stripLocaleFromPath(item.href) === pathname ? 'bg-green-600 text-white' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}
            ${isMobile ? 'text-lg w-full' : ''}`}
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
        >
          <item.icon className={`h-5 w-5 ${isMobile ? 'mr-3' : ''}`} />
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      setIsMobileMenuOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 text-lg font-semibold text-green-600 dark:text-green-500">
          <Leaf className="h-7 w-7" />
          <span>{t('appName')}</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          <NavLinks />
        </nav>

        <div className="flex items-center space-x-2 md:space-x-3">
          <LocaleSwitcher />
          <ThemeToggle />

          {isLoading ? (
            <div className="h-8 w-8 animate-pulse bg-muted rounded-full hidden md:block" aria-label={t('loadingUser')}></div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <UserCircle className="h-6 w-6" />
                  <span className="sr-only">{t('userMenu.openMenu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email} ({tRoles(user.role as keyof typeof UserRole)}) {/* Traduce el rol */}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(user.role === UserRole.Admin ? '/admin/dashboard' : user.role === UserRole.Operator ? '/operator/tasks' : '/')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('userMenu.myPanel')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-500 focus:bg-red-100 dark:focus:bg-red-700/50 focus:text-red-600 dark:focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('userMenu.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !pathname.includes('/login') && !pathname.includes('/register') && !pathname.includes('/recover-password') && (
              <Button onClick={() => router.push('/login')} variant="outline" size="sm">
                <UserPlus2 className="mr-2 h-4 w-4" />
                {t('loginButton')}
              </Button>
            )
          )}

          <div className="md:hidden">
            {!onMenuClick ? (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleMenuClick}>
                    <MenuIcon className="h-6 w-6" />
                    <span className="sr-only">{t('mobileMenu.open')}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0">
                  <div className="p-6">
                    <Link href="/" className="flex items-center space-x-2 mb-6" onClick={() => setIsMobileMenuOpen(false)}>
                      <Leaf className="h-7 w-7 text-green-600" />
                      <span className="text-xl font-semibold text-green-600">{t('appName')}</span>
                    </Link>
                    <nav className="flex flex-col space-y-3">
                      <NavLinks isMobile={true} />
                    </nav>
                  </div>
                  {isAuthenticated && user && (
                    <div className="absolute bottom-0 left-0 right-0 border-t p-4">
                      <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-600 dark:text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('userMenu.logout')}
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="ghost" size="icon" onClick={handleMenuClick}>
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">{t('mobileMenu.open')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}