// frontend\app\[locale]\(public)\(auth)\set-password\[token]\page.tsx

'use client';

import SetPasswordForm from '@/components/auth/SetPasswordForm';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function SetPasswordTokenPage() { 
  const t = useTranslations('SetPasswordTokenPage');
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  useEffect(() => {
    if (!token) {
      toast.error(t('toast.tokenNotFound'));
      router.push('/login');
    }
  }, [token, router, t]);

  
  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  if (!token) {
    
    return (
      <div className="flex items-center justify-center"> 
        <p>{t('verifyingToken')}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-white to-muted px-4">
      <div className='my-10'> 
        <SetPasswordForm token={token} />
      </div>
    </div>
  );
}