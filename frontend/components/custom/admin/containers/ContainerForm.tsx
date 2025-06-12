// frontend\components\custom\admin\containers\ContainerForm.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Container, ContainerType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { createAuthorizedApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from 'next-intl';

const MapSelector = dynamic(() => import('../../map/MapSelector'), { ssr: false });

interface ContainerFormProps {
  container?: Container | null;
  onSuccess: (savedContainer: Container) => void;
  onCancel: () => void;
}

export default function ContainerForm({ container, onSuccess, onCancel }: ContainerFormProps) {
  const t = useTranslations('ContainerForm');
  const tContainerTypes = useTranslations('types.containerTypes'); 

  const locale = useLocale();

  const [location, setLocation] = useState(container?.location || '');
  const [capacity, setCapacity] = useState<number | string>(container?.capacity || 100);
  const [type, setType] = useState<ContainerType | undefined>(container?.type || undefined);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>(
    container?.coordinates || { lat: 40.4168, lng: -3.7038 } // Default to Madrid
  );

  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    if (container) {
      setLocation(container.location || '');
      setCapacity(container.capacity || 100);
      setType(container.type || undefined);
      setCoordinates(container.coordinates || { lat: 40.4168, lng: -3.7038 });
    } else {
      setLocation('');
      setCapacity(100);
      setType(undefined);
      setCoordinates({ lat: 40.4168, lng: -3.7038 }); 
    }
  }, [container]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!type) {
      toast.error(t('toast.error.typeRequired'));
      return;
    }
    if (!location.trim()) {
      toast.error(t('toast.error.locationRequired'));
      return;
    }


    startTransition(async () => {
      try {
        const authorizedApi = await createAuthorizedApi(locale);
        const payload: any = {
          location: location.trim(),
          capacity: Number(capacity),
          type: type,
          coordinates
        };

        let savedContainer: Container;
        if (container && container.id) {
          const response = await authorizedApi.patch<Container>(`/containers/${container.id}`, payload);
          savedContainer = response.data;
          toast.success(t('toast.success.updated', { location: savedContainer.location }));
        } else {
          const response = await authorizedApi.post<Container>('/containers', payload);
          savedContainer = response.data;
          toast.success(t('toast.success.created', { location: savedContainer.location }));
        }
        onSuccess(savedContainer);
      } catch (error: any) {
        const defaultErrorKey = container ? 'toast.error.updateFailed' : 'toast.error.createFailed';
        const msg = error.response?.data?.message || t(defaultErrorKey);
        toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    });
  };

  const onMapLocationSelect = (location: { lat: number; lng: number }) => { 
    setCoordinates(location);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label htmlFor="container-location">{t('locationLabel')}</Label>
        <Input id="container-location" value={location} onChange={(e) => setLocation(e.target.value)} required disabled={isSubmitting} placeholder={t('locationPlaceholder')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="container-capacity">{t('capacityLabel')}</Label>
          <Input id="container-capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required disabled={isSubmitting} min="0" />
        </div>
        <div>
          <Label htmlFor="container-type">{t('typeLabel')}</Label>
          <Select value={type || ""} onValueChange={(value) => setType(value as ContainerType)} disabled={isSubmitting} required> {/* Added required */}
            <SelectTrigger id="container-type"><SelectValue placeholder={t('typePlaceholder')} /></SelectTrigger>
            <SelectContent>
              {Object.values(ContainerType).map(ct => (
                <SelectItem key={ct} value={ct}>{tContainerTypes(ct as keyof typeof ContainerType)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>{t('mapLocationLabel')}</Label>
        <MapSelector onLocationSelect={onMapLocationSelect} initialCenter={coordinates} />
      </div>

      <DialogFooter className="pt-6">
        <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>{t('cancelButton')}</Button></DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting
            ? (container ? t('savingButton') : t('creatingButton'))
            : (container ? t('saveChangesButton') : t('createButton'))
          }
        </Button>
      </DialogFooter>
    </form>
  );
}