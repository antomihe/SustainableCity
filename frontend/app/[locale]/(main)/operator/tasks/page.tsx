// frontend\app\[locale]\(main)\operator\tasks\page.tsx
import OperatorTasksClientContent from "@/components/custom/operator/OperatorTasksClientContent";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function OperatorTasksPage() {
  const t = await getTranslations('OperatorTasksPage');
  
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
        <Link href="/operator/tasks/pdf" passHref legacyBehavior>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            {t('downloadPdfButton')}
          </Button>
        </Link>
      </div>

      <OperatorTasksClientContent /> 
    </div>
  );
}