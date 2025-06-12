// frontend\app\[locale]\(main)\admin\containers\page.tsx
import AdminContainersClientPage from "@/components/custom/admin/containers/AdminContainersClientPage";
import { getTranslations } from "next-intl/server";

export default async function AdminContainersManagementPage() {
  const t = await getTranslations('AdminContainersManagementPage');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <AdminContainersClientPage />
    </div>
  );
}