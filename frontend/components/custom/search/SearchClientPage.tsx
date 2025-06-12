// frontend\components\custom\search\SearchClientPage.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createAuthorizedApi } from '@/lib/api';
import { toast } from 'sonner';
import { ContainerStatus, ContainerType, ContainerWithDistance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Slider } from "@/components/ui/slider";
import { Input } from '@/components/ui/input';
import { Loader2, ListFilter, SearchIcon, Compass, ExternalLink, Layers } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale, useTranslations } from 'next-intl';
import { LoadingMapResultsMessage, LoadingMapSelectorMessage } from './SearchLoadingComponents';

const ContainerMapResults = dynamic(() => import('@/components/custom/map/ContainerMap'), {
    ssr: false,
    loading: () => <LoadingMapResultsMessage />,
});
const MapSelector = dynamic(() => import('@/components/custom/map/MapSelector'), {
    ssr: false,
    loading: () => <LoadingMapSelectorMessage />,
});

interface SearchFilters {
    latitude?: number;
    longitude?: number;
    radius: number;
    types: ContainerType[];
    statuses: ContainerStatus[];
    searchTerm?: string;
}

export default function SearchClientPage() {
    const t = useTranslations('SearchClientPage');
    const tTypesNamespace = useTranslations('types');

    const locale = useLocale();

    const [foundContainers, setFoundContainers] = useState<ContainerWithDistance[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const [filters, setFilters] = useState<SearchFilters>({
        radius: 5,
        types: [],
        statuses: [],
        searchTerm: '',
    });

    const [selectedSearchCenter, setSelectedSearchCenter] = useState<{ lat: number; lng: number } | null>(null);

    const [resultsMapCenter, setResultsMapCenter] = useState<{ lat: number; lng: number } | null>(null);


    const [typeSearchTerm, setTypeSearchTerm] = useState('');
    const [statusSearchTerm, setStatusSearchTerm] = useState('');

    const handleMapLocationSelect = (location: { lat: number; lng: number }) => {
        setSelectedSearchCenter(location);
        setFilters(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
        }));
    };

    const handleStatusChange = (status: ContainerStatus) => {
        setFilters(prev => {
            const newStatuses = prev.statuses.includes(status)
                ? prev.statuses.filter(s => s !== status)
                : [...prev.statuses, status];
            return { ...prev, statuses: newStatuses };
        });
    };

    const handleSelectAllStatuses = (selectAll: boolean) => {
        setFilters(prev => ({
            ...prev,
            statuses: selectAll ? Object.values(ContainerStatus) : []
        }));
    };

    const handleTypeChange = (typeValue: ContainerType) => {
        setFilters(prev => {
            const newTypes = prev.types.includes(typeValue)
                ? prev.types.filter(t => t !== typeValue)
                : [...prev.types, typeValue];
            return { ...prev, types: newTypes };
        });
    };

    const handleSelectAllTypes = (selectAll: boolean) => {
        setFilters(prev => ({
            ...prev,
            types: selectAll ? Object.values(ContainerType) : []
        }));
    };

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const useBrowserGeolocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error(t('toast.error.geolocationNotSupported'));
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                setSelectedSearchCenter(loc);
                setFilters(prev => ({ ...prev, latitude: loc.lat, longitude: loc.lng }));
                setIsLocating(false);
                toast.success(t('toast.success.locationObtained'));
            },
            (geoError) => {
                setIsLocating(false);
                let msgKey = 'toast.error.geolocationGenericError';
                switch (geoError.code) {
                    case geoError.PERMISSION_DENIED: msgKey = 'toast.error.geolocationPermissionDenied'; break;
                    case geoError.POSITION_UNAVAILABLE: msgKey = 'toast.error.geolocationPositionUnavailable'; break;
                    case geoError.TIMEOUT: msgKey = 'toast.error.geolocationTimeout'; break;
                }
                toast.error(t(msgKey));
            }, { timeout: 10000, enableHighAccuracy: true }
        );
    }, [t]);

    useEffect(() => { }, [useBrowserGeolocation]);

    const performActualSearch = useCallback(async () => {
        if (!filters.latitude || !filters.longitude) {
            toast.error(t('toast.error.selectLocationFirst'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const authorizedApi = await createAuthorizedApi(locale);
            const body = {
                latitude: filters.latitude,
                longitude: filters.longitude,
                radius: filters.radius,
                types: filters.types.length > 0 ? filters.types : undefined,
                statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
                searchTerm: filters.searchTerm || undefined,
            };
            const response = await authorizedApi.post<ContainerWithDistance[]>(`/containers/search`, body);

            setFoundContainers(response.data);
            setResultsMapCenter({ lat: filters.latitude, lng: filters.longitude });
            setHasSearched(true);

            if (response.data.length === 0) {
                toast.info(t('toast.info.noContainersFoundFilters'));
            } else {
                toast.success(t('toast.success.foundContainers', { count: response.data.length }));
            }

        } catch (err: any) {
            const backendMessage = err.response?.data?.message;
            const msg = backendMessage || t('toast.error.searchDefault');
            setError(msg);
            setHasSearched(true);
            setFoundContainers([]);
            setResultsMapCenter(null);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, [filters, t]);

    const filteredTypes = useMemo(() => {
        return Object.values(ContainerType).filter(type =>
            tTypesNamespace(`containerTypes.${type}`).toLowerCase().includes(typeSearchTerm.toLowerCase())
        );
    }, [typeSearchTerm, tTypesNamespace]);

    const filteredStatuses = useMemo(() => {
        return Object.values(ContainerStatus).filter(status =>
            tTypesNamespace(`containerStatuses.${status}`).toLowerCase().includes(statusSearchTerm.toLowerCase())
        );
    }, [statusSearchTerm, tTypesNamespace]);

    const getSelectedTypesText = () => {
        if (filters.types.length === 0 || filters.types.length === Object.values(ContainerType).length) {
            return t('filters.anyType');
        }
        return filters.types.map(s => tTypesNamespace(`containerTypes.${s}`)).join(', ');
    };

    const getSelectedStatusesText = () => {
        if (filters.statuses.length === 0 || filters.statuses.length === Object.values(ContainerStatus).length) {
            return t('filters.anyStatus');
        }
        return filters.statuses.map(s => tTypesNamespace(`containerStatuses.${s}`)).join(', ');
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ListFilter className="h-5 w-5" />{t('filters.title')}</CardTitle>
                    <CardDescription>{t('filters.description')}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-3">
                        <Label>{t('filters.searchCenterLabel')}</Label>
                        <MapSelector
                            onLocationSelect={handleMapLocationSelect}
                            initialCenter={selectedSearchCenter}
                            currentRadiusKm={filters.radius}
                        />
                        <Button onClick={useBrowserGeolocation} disabled={isLocating || isLoading} variant="secondary" className="w-full text-sm mt-2">
                            {isLocating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLocating ? t('filters.locatingButton') : t('filters.useMyLocationButton')}
                            {!isLocating && <Compass className="ml-2 h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="lg:col-span-1 flex flex-col justify-start gap-6 pt-0 lg:pt-16">
                        <div>
                            <Label htmlFor="search-term" className="mb-1 block">{t('filters.searchTermLabel')}</Label>
                            <Input
                                id="search-term"
                                placeholder={t('filters.searchTermPlaceholder')}
                                value={filters.searchTerm || ''}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                disabled={isLoading || isLocating}
                                className="bg-background"
                            />
                        </div>
                        <div>
                            <Label htmlFor="radius-slider" className="mb-1 block">{t('filters.searchRadiusLabel', { radius: filters.radius })}</Label>
                            <Slider
                                id="radius-slider"
                                min={1} max={50} step={1}
                                defaultValue={[filters.radius]}
                                onValueChange={(value) => handleFilterChange('radius', value[0])}
                                disabled={isLoading || isLocating}
                            />
                        </div>

                        <div>
                            <Label className="mb-2 block font-medium">{t('filters.containerTypeLabel')}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start font-normal text-left h-auto min-h-[2.5rem] items-center">
                                        <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">{getSelectedTypesText()}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <div className="p-2 border-b">
                                        <Input
                                            placeholder={t('filters.searchTypePlaceholder')}
                                            value={typeSearchTerm}
                                            onChange={(e) => setTypeSearchTerm(e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="flex justify-between p-2 border-b text-xs">
                                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleSelectAllTypes(true)}>{t('filters.selectAll')}</Button>
                                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleSelectAllTypes(false)}>{t('filters.deselectAll')}</Button>
                                    </div>
                                    <ScrollArea className="max-h-60">
                                        <div className="p-2 space-y-1">
                                            {filteredTypes.map(type => (
                                                <div key={`type-${type}`} className="flex items-center space-x-2 p-1.5 rounded hover:bg-accent">
                                                    <Checkbox
                                                        id={`type-filter-${type}`}
                                                        checked={filters.types.includes(type)}
                                                        onCheckedChange={() => handleTypeChange(type)}
                                                        disabled={isLoading}
                                                    />
                                                    <Label htmlFor={`type-filter-${type}`} className="text-sm font-normal cursor-pointer flex-grow">
                                                        {tTypesNamespace(`containerTypes.${type}`)}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <Label className="mb-2 block font-medium">{t('filters.containerStatusLabel')}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start font-normal text-left h-auto min-h-[2.5rem] items-center">
                                        <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">{getSelectedStatusesText()}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <div className="p-2 border-b">
                                        <Input
                                            placeholder={t('filters.searchStatusPlaceholder')}
                                            value={statusSearchTerm}
                                            onChange={(e) => setStatusSearchTerm(e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="flex justify-between p-2 border-b text-xs">
                                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleSelectAllStatuses(true)}>{t('filters.selectAll')}</Button>
                                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleSelectAllStatuses(false)}>{t('filters.deselectAll')}</Button>
                                    </div>
                                    <ScrollArea className="max-h-60">
                                        <div className="p-2 space-y-1">
                                            {filteredStatuses.map(status => (
                                                <div key={`status-${status}`} className="flex items-center space-x-2 p-1.5 rounded hover:bg-accent">
                                                    <Checkbox
                                                        id={`status-filter-${status}`}
                                                        checked={filters.statuses.includes(status)}
                                                        onCheckedChange={() => handleStatusChange(status)}
                                                        disabled={isLoading}
                                                    />
                                                    <Label htmlFor={`status-filter-${status}`} className="text-sm font-normal cursor-pointer flex-grow">
                                                        {tTypesNamespace(`containerStatuses.${status}`)}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={performActualSearch} disabled={isLoading || isLocating || (!filters.latitude || !filters.longitude)} className="w-full">
                        {(isLoading || isLocating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('filters.searchButton')}
                        {!isLoading && !isLocating && <SearchIcon className="ml-2 h-4 w-4" />}
                    </Button>
                </CardFooter>
            </Card>

            {hasSearched && error && !isLoading && (
                <Card className="border-destructive mt-6">
                    <CardHeader><CardTitle className="text-destructive">{t('results.errorTitle')}</CardTitle></CardHeader>
                    <CardContent><p>{error}</p></CardContent>
                </Card>
            )}

            {hasSearched && !isLoading && !error && foundContainers.length > 0 && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>{t('results.titleFound', { count: foundContainers.length })}</CardTitle>
                        <CardDescription>{t('results.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">{t('results.mapTitle')}</h3>
                            <ContainerMapResults
                                initialContainers={foundContainers}
                                center={resultsMapCenter ? [resultsMapCenter.lat, resultsMapCenter.lng] : undefined}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3">{t('results.listTitle')}</h3>
                            <div className="p-4 space-y-3">
                                {foundContainers.map(container => (
                                    <Card key={container.id} className="p-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-grow">
                                                <p className="font-semibold text-base">{container.location}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('results.containerTypeLabel')}: {tTypesNamespace(`containerTypes.${container.type}`)} | {t('results.containerStatusLabel')}: {container.status ? tTypesNamespace(`containerStatuses.${container.status}`) : t('results.statusN_A')}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('results.fillLevelLabel', { level: container.fillLevel })} | {t('results.capacityLabel', { capacity: container.capacity })}
                                                </p>
                                                {container.distance != null && <p className="text-xs text-muted-foreground">{t('results.distanceLabel', { distance: container.distance.toFixed(2) })}</p>}
                                                {container.lastEmptiedAt && <p className="text-xs text-muted-foreground">{t('results.lastEmptiedLabel', { date: new Date(container.lastEmptiedAt).toLocaleDateString() })}</p>}
                                            </div>
                                            <div className="flex-shrink-0">
                                                {container.coordinates && (
                                                    <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                                                        <Link href={`https://www.google.com/maps/search/?api=1&query=${container.coordinates.lat},${container.coordinates.lng}`} target="_blank" rel="noopener noreferrer" aria-label={t('results.openInMapsAriaLabel')}>
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-2 border-t pt-2">
                                            <Link href={`/report-incident?containerId=${container.id}`} passHref legacyBehavior>
                                                <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600 hover:text-blue-700">
                                                    {t('results.reportIncidentLink')}
                                                </Button>
                                            </Link>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            {hasSearched && !isLoading && !error && foundContainers.length === 0 && (
                <Card className="text-center py-10 mt-6 bg-muted/30">
                    <CardContent>
                        <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">{t('results.noContainersFoundTitle')}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t('results.noContainersFoundSuggestion')}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}