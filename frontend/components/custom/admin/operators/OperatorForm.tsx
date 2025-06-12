// frontend\components\custom\admin\operators\OperatorForm.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Operator } from '@/lib/types'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { createAuthorizedApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl'; 

interface OperatorFormProps {
  operator?: Operator | null;
  onSuccess: (createdOrUpdatedOperator: Operator) => void; 
  onCancel: () => void;
}

export default function OperatorForm({ operator, onSuccess, onCancel }: OperatorFormProps) {
  const t = useTranslations('OperatorForm'); 
  const [name, setName] = useState(operator?.name || '');
  const [email, setEmail] = useState(operator?.email || '');
  const [isSubmitting, startTransition] = useTransition();

  const locale = useLocale();

  useEffect(() => {
    if (operator) {
      setName(operator.name || '');
      setEmail(operator.email || '');
    } else {
      
      setName('');
      setEmail('');
    }
  }, [operator]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) { 
        toast.error(t('toast.error.emailRequired'));
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        toast.error(t('toast.error.invalidEmail'));
        return;
    }
    if (!name.trim()) { 
        toast.error(t('toast.error.nameRequired'));
        return;
    }

    startTransition(async () => {
      try {
        const authorizedApi = await createAuthorizedApi(locale);
        const payload: any = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
        };

        let savedOperator: Operator; 
        if (operator && operator.id) {
          savedOperator = (await authorizedApi.patch(`/users/${operator.id}`, payload)).data;
          toast.success(t('toast.success.updated', { nameOrEmail: payload.name || payload.email }));
        } else {
          savedOperator = (await authorizedApi.post('/users/operator', payload)).data;
          toast.success(t('toast.success.created', { nameOrEmail: payload.name || payload.email }));
        }
        onSuccess(savedOperator);
      } catch (error: any) {
        console.error("Error saving operator:", error);
        const defaultErrorKey = operator ? 'toast.error.updateFailed' : 'toast.error.createFailed';
        const msg = error.response?.data?.message || t(defaultErrorKey);
        toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <Label htmlFor="operator-name">{t('nameLabel')}</Label>
        <Input
          id="operator-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="operator-email">{t('emailLabel')}</Label>
        <Input
          id="operator-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          placeholder={t('emailPlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t('buttons.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting
            ? (operator ? t('buttons.updating') : t('buttons.creating'))
            : (operator ? t('buttons.saveChanges') : t('buttons.createOperator'))
          }
        </Button>
      </DialogFooter>
    </form>
  );
}