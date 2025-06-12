// frontend\app\[locale]\(main)\admin\dashboard\page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, PackageOpen, BarChartBig } from "lucide-react";
import Link from "next/link";
import AdminDashboardClientContent from "@/components/custom/admin/AdminDashboardClientContent";
import { useEffect } from "react";
import { createAuthorizedApi } from "@/lib/api";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
export default function AdminDashboardPage() {
  const t = useTranslations('AdminDashboardPage');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const authorizedApi = await createAuthorizedApi();
        const response = await authorizedApi.get('/admin/dashboard-summary');
        const data = await response.data;

        const fullContainersElem = document.getElementById('full-containers-count');
        if (fullContainersElem) fullContainersElem.textContent = data.fullContainers.toString();

        const openIncidentsElem = document.getElementById('open-incidents-count');
        if (openIncidentsElem) openIncidentsElem.textContent = data.activeIncidents.toString();

        const totalContainersElem = document.getElementById('number-of-containers');
        if (totalContainersElem) totalContainersElem.textContent = data.totalContainers.toString();

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error(t('toast.error.fetchDataFailed'));
      }
    }
    fetchDashboardData();
  }, []);

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t('header.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('header.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.fullContainers.title')}</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" id="full-containers-count">
              -
            </div>
            <p className="text-xs text-muted-foreground">
              {t('cards.fullContainers.description')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.openIncidents.title')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" id="open-incidents-count">
              -
            </div>
            <p className="text-xs text-muted-foreground">
              {t('cards.openIncidents.description')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.availableContainers.title')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" id="number-of-containers">
              -
            </div>
            <p className="text-xs text-muted-foreground">
              {t('cards.availableContainers.description')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.viewStats.title')}</CardTitle>
            <BarChartBig className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/admin/stats" className="text-sm font-semibold text-green-600 hover:underline">
              {t('cards.viewStats.link')}
            </Link>
            <p className="text-xs text-muted-foreground mt-1">
              {t('cards.viewStats.description')}
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminDashboardClientContent />
    </div>
  );
}