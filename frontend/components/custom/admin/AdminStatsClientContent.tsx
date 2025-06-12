// frontend\components\custom\admin\AdminStatsClientContent.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { createAuthorizedApi } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitleElement, 
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Loader2, AlertTriangle, Filter, RefreshCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Container, ContainerType, ContainerStatus } from '@/lib/types'; 
import { useLocale, useTranslations } from 'next-intl';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ChartTitleElement, Tooltip, Legend, ArcElement, PointElement, LineElement
);

interface FillLevelStats { labels: string[]; data: number[]; }
interface ContainerTypeStats { labels: string[]; data: number[]; }

interface StatsData {
  fillLevelDistribution?: FillLevelStats;
  containerTypeDistribution?: ContainerTypeStats;
}

export default function AdminStatsClientContent() {
  const t = useTranslations('AdminStatsClientContent');
  const tChartLabels = useTranslations('AdminStatsClientContent.chartLabels'); 
  const tContainerTypes = useTranslations('types.containerTypes'); 
  const tMisc = useTranslations('shared');

  const locale = useLocale();
  
  const { socket } = useSocket();
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContainerType, setSelectedContainerType] = useState<string>('ALL');
  
  interface ContainerTypeSelectOption {
    value: string;
    label: string;
  }

  const containerTypeSelectOptions: ContainerTypeSelectOption[] = useMemo(() => [
    { value: 'ALL', label: tMisc('allTypes') },
    ...Object.values(ContainerType || {}).map(ct => ({
      value: ct,
      label: tContainerTypes(ct as keyof typeof ContainerType)
    }))
  ], [tMisc, tContainerTypes]);

  const fetchStatsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authorizedApi = await createAuthorizedApi(locale);
      const params = new URLSearchParams();
      if (selectedContainerType !== 'ALL') params.append('containerType', selectedContainerType);
      const query = params.toString();

      const [
        responseFillLevel,
        responseContainerType,
      ] = await Promise.all([
        authorizedApi.get(`/admin/statistics/container-usage?${query}`),
        authorizedApi.get(`/admin/statistics/container-types?${query}`),
      ]);

      const rawFillData = responseFillLevel.data;
      const fillLevelKeys: string[] = [
        'range0_25', 'range26_50', 'range51_75', 'range76_84',
        'range85_99_critical', 'rangeFull_100', 'rangeDamagedOrOverflowing'
      ];
      const fillLevels: { [key: string]: number } = {};
      fillLevelKeys.forEach(key => fillLevels[tChartLabels(`fillLevelDistributionRanges.${key}`)] = 0);

      (rawFillData.containersSummary || []).forEach((c: Container) => {
        if (c.status === ContainerStatus.DAMAGED) fillLevels[tChartLabels('fillLevelDistributionRanges.rangeDamagedOrOverflowing')]++;
        else if (c.fillLevel === 100 || c.status === ContainerStatus.FULL) fillLevels[tChartLabels('fillLevelDistributionRanges.rangeFull_100')]++;
        else if (c.fillLevel >= 85) fillLevels[tChartLabels('fillLevelDistributionRanges.range85_99_critical')]++;
        else if (c.fillLevel >= 76) fillLevels[tChartLabels('fillLevelDistributionRanges.range76_84')]++;
        else if (c.fillLevel >= 51) fillLevels[tChartLabels('fillLevelDistributionRanges.range51_75')]++;
        else if (c.fillLevel >= 26) fillLevels[tChartLabels('fillLevelDistributionRanges.range26_50')]++;
        else fillLevels[tChartLabels('fillLevelDistributionRanges.range0_25')]++;
      });

      const translatedContainerTypeLabels = responseContainerType.data.labels.map(
        (label: string) => tContainerTypes(label as keyof typeof ContainerType) || label
      );

      setStatsData({
        fillLevelDistribution: { labels: Object.keys(fillLevels), data: Object.values(fillLevels) },
        containerTypeDistribution: { ...responseContainerType.data, labels: translatedContainerTypeLabels },
      });

    } catch (err: any) {
      console.error("Error fetching stats data:", err);
      const errorMessage = err.response?.data?.message || t('toast.error.loadStatsFailed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedContainerType, t, tChartLabels, tContainerTypes]);

  useEffect(() => {
    fetchStatsData();
  }, [fetchStatsData]);

  useEffect(() => {
    if (!socket) return;
    const handleDataUpdate = () => {
      toast.info(t('toast.info.newDataAvailable'));
      fetchStatsData();
    };
    socket.on('containerUpdated', handleDataUpdate);
    socket.on('newIncidentReported', handleDataUpdate);

    return () => {
      socket.off('containerUpdated', handleDataUpdate);
      socket.off('newIncidentReported', handleDataUpdate);
    };
  }, [socket, fetchStatsData, t]);

  const chartOptions = (chartTitleKey: string, yAxisBeginAtZero = true, yAxisStepSize?: number) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: tChartLabels(chartTitleKey as any), font: { size: 16 } }, 
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null && context.parsed.y !== undefined) label += context.parsed.y;
            else if (context.parsed !== undefined && (context.chart.config.type === 'pie' || context.chart.config.type === 'doughnut')) {
              label = context.label + ': ' + context.parsed;
            }
            return label;
          }
        }
      }
    }
  });

  const barChartColors = ['#22C55E99', '#EAB30899', '#F9731699', '#EF44448C', '#DC2626CC', '#B91C1CCC', '#37415199'];
  const barChartBorderColors = barChartColors.map(color => color.substring(0, 7));
  const pieDoughnutColors = ['#36A2EBCC', '#FFCE56CC', '#4BC0C0CC', '#9966FFCC', '#FF9F40CC', '#FF6384CC', '#64B478CC'];
  const pieDoughnutBorderColors = pieDoughnutColors.map(color => color.substring(0, 7));


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />{t('filters.title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="container-type-select">{t('filters.containerTypeLabel')}</Label>
            <Select value={selectedContainerType} onValueChange={setSelectedContainerType} disabled={isLoading}>
              <SelectTrigger id="container-type-select" className="mt-1 w-full sm:w-auto min-w-[200px]">
                <SelectValue placeholder={t('filters.selectTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {containerTypeSelectOptions.map((option: ContainerTypeSelectOption) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchStatsData} disabled={isLoading} className="w-full sm:w-auto mt-1 sm:mt-0 md:self-end">
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('filters.applyButton')}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (<div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-4 text-muted-foreground">{t('loadingState.loadingText')}</p></div>)}
      {error && !isLoading && (<div className="flex flex-col items-center justify-center h-64 text-center p-4 border border-dashed border-red-500/50 rounded-lg bg-red-50 dark:bg-red-900/20"><AlertTriangle className="h-12 w-12 text-red-500 mb-4" /><p className="text-red-700 dark:text-red-400 font-semibold">{t('errorState.title')}</p><p className="text-sm text-muted-foreground mt-1">{error}</p><Button onClick={fetchStatsData} variant="outline" className="mt-4">{t('errorState.retryButton')}</Button></div>)}
      {!isLoading && !error && !statsData && (<div className="text-center py-10 text-muted-foreground">{t('emptyState.noData')}</div>)}

      {!isLoading && !error && statsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {statsData.fillLevelDistribution && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('fillLevelCard.title')}</CardTitle>
                <CardDescription>{t('fillLevelCard.description')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] md:h-[450px]">
                <Bar options={chartOptions('fillLevelChartTitle')} data={{
                  labels: statsData.fillLevelDistribution.labels,
                  datasets: [{ label: tChartLabels('fillLevelDatasetLabel'), data: statsData.fillLevelDistribution.data, backgroundColor: barChartColors, borderColor: barChartBorderColors, borderWidth: 1, }],
                }} />
              </CardContent>
            </Card>
          )}

          {statsData.containerTypeDistribution && (
            <Card className="lg:col-span-2 mt-6">
              <CardHeader>
                <CardTitle>{t('containerTypeCard.title')}</CardTitle>
                <CardDescription>{t('containerTypeCard.description')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] md:h-[400px]">
                <Pie options={chartOptions('containerTypeChartTitle')} data={{
                  labels: statsData.containerTypeDistribution.labels,
                  datasets: [{ data: statsData.containerTypeDistribution.data, backgroundColor: pieDoughnutColors, borderColor: pieDoughnutBorderColors, borderWidth: 1, }],
                }} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}