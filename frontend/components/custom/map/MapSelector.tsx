// frontend\components\custom\map\MapSelector.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression, Map } from 'leaflet';
import { useEffect, useState, useRef } from 'react'; 
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialCenter?: { lat: number; lng: number } | null;
  currentRadiusKm?: number;
  className?: string;
}

function LocationMarkerAndCircle({
  onMapClick,
  center,
  radiusKm
}: {
  onMapClick: (latlng: L.LatLng) => void,
  center: LatLngExpression | null,
  radiusKm?: number
}) {
  const t = useTranslations('MapSelector.LocationMarker');
  const [currentPosition, setCurrentPosition] = useState<LatLngExpression | null>(center);

  const map = useMapEvents({
    click(e) {
      setCurrentPosition(e.latlng);
      onMapClick(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (center) {
      const centerLatLng = L.latLng(center as L.LatLngTuple);
      if (!currentPosition || !centerLatLng.equals(L.latLng(currentPosition as L.LatLngTuple), 0.0001)) {
        setCurrentPosition(center);
        map.flyTo(center, map.getZoom() > 13 ? map.getZoom() : 14, { animate: true });
      }
    } else if (currentPosition) {
      setCurrentPosition(null);
    }
  }, [center, map, currentPosition]);


  if (!currentPosition) return null;

  return (
    <>
      <Marker position={currentPosition}>
        <Popup>{t('popupText')}</Popup>
      </Marker>
      {radiusKm && (
        <Circle center={currentPosition} radius={radiusKm * 1000} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.08 }} />
      )}
    </>
  );
}

export default function MapSelector({
  onLocationSelect,
  initialCenter,
  currentRadiusKm,
  className,
}: MapSelectorProps) {
  const t = useTranslations('MapSelector');
  const [mapCenterForSelector, setMapCenterForSelector] = useState<{ lat: number; lng: number } | null>(initialCenter || null);
  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number } | null>(initialCenter || null);
  const mapRef = useRef<Map>(null);
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  const defaultViewCenter: LatLngExpression = initialCenter
    ? [initialCenter.lat, initialCenter.lng]
    : [40.416775, -3.70379];

  const handleMapClick = (latlng: L.LatLng) => {
    setClickedPoint({ lat: latlng.lat, lng: latlng.lng });
    onLocationSelect({ lat: latlng.lat, lng: latlng.lng });
  };

  useEffect(() => {
    if (initialCenter) {
      setMapCenterForSelector(initialCenter);
      setClickedPoint(initialCenter);
      if (mapRef.current) {
        mapRef.current.flyTo([initialCenter.lat, initialCenter.lng], mapRef.current.getZoom() > 13 ? mapRef.current.getZoom() : 14);
      }
    }
  }, [initialCenter]);

  const tileLayerUrl = currentTheme === 'dark'
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileLayerAttribution = currentTheme === 'dark'
    ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
    : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm text-muted-foreground">
        {t('instructionText')}
      </p>
      <MapContainer
        center={mapCenterForSelector ? [mapCenterForSelector.lat, mapCenterForSelector.lng] : defaultViewCenter}
        zoom={mapCenterForSelector ? 14 : 10}
        style={{ height: '300px', width: '100%', zIndex: 0 }}
        className="rounded-md shadow-md"
        key={currentTheme}
        ref={mapRef} 
      >
        <TileLayer url={tileLayerUrl} attribution={tileLayerAttribution} />
        <LocationMarkerAndCircle
          onMapClick={handleMapClick}
          center={clickedPoint ? [clickedPoint.lat, clickedPoint.lng] : null}
          radiusKm={currentRadiusKm}
        />
      </MapContainer>
      {clickedPoint && (
        <p className="text-xs text-center text-muted-foreground">
          {t('selectedPointText', { lat: clickedPoint.lat.toFixed(4), lng: clickedPoint.lng.toFixed(4) })}
        </p>
      )}
    </div>
  );
}