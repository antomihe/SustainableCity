// frontend\components\custom\map\ContainerMap.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Container, ContainerStatus, ContainerType } from '@/lib/types'; 
import { getPublicApiInstance } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';

// Leaflet marker icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const getMarkerColor = (fillLevel: number, status: ContainerStatus): string => {
  if (status === ContainerStatus.DAMAGED) return '#374151'; 
  if (status === ContainerStatus.FULL) return '#EF4444';    
  if (fillLevel >= 85) return '#F97316';                   
  if (fillLevel >= 50) return '#EAB308';                   
  return '#22C55E';                                        
};

interface ContainerMapProps {
  initialContainers?: Container[];
  center?: [number, number]; // latitude, longitude
}

export default function ContainerMap({ initialContainers, center = [40.4168, -3.7038]}: ContainerMapProps) {
  const t = useTranslations('ContainerMap');
  const tTypesNamespace = useTranslations('types');

  const locale = useLocale();

  const [containers, setContainers] = useState<Container[]>(initialContainers || []);
  const [loading, setLoading] = useState(!initialContainers);
  const { socket } = useSocket();
  const { theme, systemTheme } = useTheme();

  const currentTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        setLoading(true);
        const api = getPublicApiInstance(locale);
        const response = await api.get<Container[]>('/containers');
        setContainers(response.data);
      } catch (error) {
        console.error('Error fetching containers:', error);
        toast.error(t('toast.error.loadContainersFailed'));
      } finally {
        setLoading(false);
      }
    };

    if (!initialContainers) {
      fetchContainers();
    }
  }, [initialContainers, t]);

  useEffect(() => {
    if (!socket) return;

    socket.on('containersUpdate', (updatedContainers: Container[]) => {
      setContainers(updatedContainers);
    });

    socket.on('containerUpdated', (updatedContainer: Container) => {
      setContainers((prevContainers) =>
        prevContainers.map((c) => (c.id === updatedContainer.id ? updatedContainer : c))
      );
    });

    socket.on('containerDeleted', ({ id }: { id: string }) => {
      setContainers((prevContainers) => prevContainers.filter((c) => c.id !== id));
    });

    return () => {
      socket.off('containersUpdate');
      socket.off('containerUpdated');
      socket.off('containerDeleted');
    };
  }, [socket]);

  const tileLayerProps = useMemo(() => {
    if (currentTheme === 'dark') {
      return {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      };
    }
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };
  }, [currentTheme]);

  if (loading) {
    return (
      <div className="h-[400px] md:h-[500px] w-full bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center rounded-md">
        <p className="text-gray-500 dark:text-gray-400">{t('loadingData')}</p>
      </div>
    );
  }

  return (
    <div className="relative z-0">
      <div className="absolute top-2 right-2 z-[9999] bg-background/80 dark:bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md shadow text-sm font-medium text-foreground">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse z-10"></span>
        {t('liveIndicator')}
      </div>

      <MapContainer
        key={`${currentTheme}-${center.join('-')}`} 
        center={center}
        zoom={13}
        style={{ height: '500px', width: '100%' }}
        className="rounded-md shadow-lg dark:shadow-gray-900/50"
      >
        <TileLayer
          url={tileLayerProps.url}
          attribution={tileLayerProps.attribution}
        />
        {containers.map((container) =>
          container.coordinates ? (
            <CircleMarker
              key={container.id}
              center={[container.coordinates.lat, container.coordinates.lng]}
              pathOptions={{
                color: getMarkerColor(container.fillLevel, container.status),
                fillColor: getMarkerColor(container.fillLevel, container.status),
                fillOpacity: currentTheme === 'dark' ? 0.65 : 0.5, 
                weight: currentTheme === 'dark' ? 1.5 : 1,
              }}
              radius={8}
            >
              <Popup>
                <div className="dark:text-gray-900"> 
                  <b>{container.location}</b><br />
                  {t('popup.fillLevel', { fillLevel: container.fillLevel })}<br />
                  {t('popup.wasteTypeLabel')} {tTypesNamespace(`containerTypes.${container.type as ContainerType}`)}<br />
                  {t('popup.statusLabel')} {tTypesNamespace(`containerStatuses.${container.status as ContainerStatus}`)}<br />
                  {t('popup.capacity', { capacity: container.capacity })}
                </div>
              </Popup>
            </CircleMarker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
}