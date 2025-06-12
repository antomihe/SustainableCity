// frontend\components\custom\admin\AdminDashboardClientContent.tsx
'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Container } from '@/lib/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ContainerMapWrapper from '../map/ContainerMapWrapper';
import { useTranslations } from 'next-intl';

export default function AdminDashboardClientContent() {
  const t = useTranslations('AdminDashboardClientContent');
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleCriticalAlert = (container: Container) => {
      toast.error(
        t('toast.criticalAlert', {
          location: container.location,
          fillLevel: container.fillLevel,
        }),
        {
          duration: 10000,
        }
      );
    };

    socket.on('criticalContainerAlert', handleCriticalAlert);

    return () => {
      socket.off('criticalContainerAlert', handleCriticalAlert);
    };
  }, [socket, t]); 

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('mapCard.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ContainerMapWrapper />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('incidentsCard.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('incidentsCard.placeholder')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('alertsCard.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('alertsCard.placeholder')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}