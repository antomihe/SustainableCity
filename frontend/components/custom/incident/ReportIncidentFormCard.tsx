// frontend\components\custom\incident\ReportIncidentFormCard.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPublicApiInstance } from '@/lib/api';
import { Container, IncidentType, ContainerType } from '@/lib/types';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

interface ReportIncidentPayload {
  containerId: string;
  description?: string;
  type: IncidentType;
}

export default function ReportIncidentFormCard() {
  const t = useTranslations('ReportIncidentFormCard');
  const tTypesNamespace = useTranslations('types');

  const locale = useLocale();

  const searchParams = useSearchParams();
  const initialContainerId = searchParams.get('containerId') || undefined;

  const [selectedContainerId, setSelectedContainerId] = useState<string | undefined>(initialContainerId);
  const [description, setDescription] = useState('');
  const [containers, setContainers] = useState<Container[]>([]);
  const [type, setIncidentType] = useState<IncidentType | undefined>(undefined);

  const [isFetchingContainers, setIsFetchingContainers] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    const fetchContainers = async () => {
      setIsFetchingContainers(true);
      try {
        const api = getPublicApiInstance(locale);
        const response = await api.get<Container[]>('/containers');
        setContainers(response.data);

        if (initialContainerId && !response.data.find(c => c.id === initialContainerId)) {
          setSelectedContainerId(undefined);
        } else if (initialContainerId) {
          setSelectedContainerId(initialContainerId);
        }

      } catch (error) {
        console.error("Error fetching containers for incident report:", error);
        toast.error(t('toast.error.fetchContainers'));
      } finally {
        setIsFetchingContainers(false);
      }
    };
    fetchContainers();
  }, [initialContainerId, t]);

  useEffect(() => {
    if (initialContainerId && containers.length > 0) {
      if (containers.find(c => c.id === initialContainerId)) {
        setSelectedContainerId(initialContainerId);
      }
    }
  }, [initialContainerId, containers]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedContainerId) {
      toast.error(t('toast.error.selectContainer'));
      return;
    }
    if (!type) {
      toast.error(t('toast.error.selectIncidentType'));
      return;
    }

    startTransition(async () => {
      try {
        const payload: ReportIncidentPayload = {
          containerId: selectedContainerId,
          type,
          description: type === IncidentType.DAMAGED ? description : undefined,
        };

        const api = getPublicApiInstance(locale);
        await api.post('/incidents/report', payload);

        toast.success(t('toast.success.reportSucceededTitle'), {
          description: t('toast.success.reportSucceededDescription'),
        });
        setSelectedContainerId(undefined);
        setDescription('');
        setIncidentType(undefined);
      } catch (error: any) {
        console.error('Incident report failed:', error);
        const errorMessage = error.response?.data?.message || t('toast.error.reportFailedDefault');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="container-select">{t('affectedContainerLabel')}</Label>
            <Select
              value={selectedContainerId || ""}
              onValueChange={setSelectedContainerId}
              disabled={isFetchingContainers || isSubmitting}
            >
              <SelectTrigger id="container-select">
                <SelectValue placeholder={isFetchingContainers ? t('loadingContainersPlaceholder') : t('selectContainerPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {containers.length > 0 ? (
                  containers.map((container) => (
                    <SelectItem key={container.id} value={container.id}>
                      {container.location} ({tTypesNamespace(`containerTypes.${container.type as ContainerType}`)}) {/* Traducido aquí */}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-containers" disabled>
                    {isFetchingContainers ? t('loadingItem') : t('noContainersAvailable')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div>
              <Label htmlFor="type-select">{t('incidentTypeLabel')}</Label>
              <Select
                value={type ?? ""}
                onValueChange={(value) => setIncidentType(value as IncidentType)}
                disabled={isSubmitting}
                name="incidentType"
              >
                <SelectTrigger id="type-select">
                  <SelectValue placeholder={t('selectIncidentTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent
                  className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400"
                >
                  {Object.values(IncidentType).map((incidentVal) => (
                    <SelectItem key={incidentVal} value={incidentVal}>
                      {t(`incidentTypes.${incidentVal}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === IncidentType.DAMAGED &&
            <div>
              <Label htmlFor="description-textarea">{t('incidentDescriptionLabel')}</Label>
              <Textarea
                id="description-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required={type === IncidentType.DAMAGED}
                placeholder={t('descriptionPlaceholder')}
                disabled={isSubmitting}
                rows={4}
                className="resize-none"
              />
            </div>
          }
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isFetchingContainers || isSubmitting}>
            {isSubmitting ? t('submittingButton') : t('submitButton')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}