// frontend\components\client\LocaleSwitcher.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/app/i18n/navigation';
import { useTransition, useEffect } from 'react';
import { Languages } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function onSelectChange(value: string) {
    startTransition(() => {
      router.replace(pathname, { locale: value });
    });
  }

  return (
    <div className="relative flex items-center gap-2">
      <Select value={locale} onValueChange={onSelectChange} disabled={isPending}>
        <SelectTrigger
          className="h-8 px-3 rounded-full border border-border bg-background text-xs font-medium shadow-sm hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={t('label')}
        >
          <div className="flex items-center gap-2">
            <Languages size={14} className="text-muted-foreground" />
            {locale.toUpperCase()}
          </div>
        </SelectTrigger>
        <SelectContent side="bottom" align="end" className="rounded-md text-xs">
          <SelectItem value="en">🇬🇧 EN</SelectItem>
          <SelectItem value="es">🇪🇸 ES</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
