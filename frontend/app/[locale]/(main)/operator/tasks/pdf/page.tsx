// frontend\app\[locale]\(main)\operator\tasks\pdf\page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle, FileQuestion, Download } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { createAuthorizedApi } from '@/lib/api';

export default function OperatorTasksPdfPage() {
  const t = useTranslations('OperatorTasksPdfPage');
  const locale = useLocale();
  const { user, isLoading: isLoadingUser } = useAuth(); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isLoadingUser || !user?.id) return;

    const getPdfBlob = async (url: string): Promise<Blob | undefined> => {
      const authorizedApi = await createAuthorizedApi(locale);
      try {
        const response = await authorizedApi.get(url, {
          responseType: 'blob',
        });
        return response.data;
      } catch (err) {
        console.error("Error generating PDF:", err);
        toast.error(t('toast.error.pdfGenerationFailed'));
        return undefined;
      }
    };

    const fetchPdfForPreview = async () => {
      setIsLoading(true);
      setError(null);
      setPdfBlobUrl(null);

      try {
        const relativeApiUrl = `/operator/${user.id}/tasks-pdf`;
        const blob = await getPdfBlob(relativeApiUrl);
        const objectUrl = URL.createObjectURL(blob!);
        setPdfBlobUrl(objectUrl);
      } catch (err: any) {
        console.error("Error fetching PDF:", err);
        const errorMessage = err.message || t('toast.errors.pdfGenerationFailed');
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdfForPreview();

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [user?.id, isLoadingUser, locale, t]);

  const handleManualDownload = () => {
    if (pdfBlobUrl && !isLoading) {
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = t('download.filename', {
        operatorId: user?.id || t('download.unknownOperator'),
        date: new Date().toISOString().split('T')[0]
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('toast.success.downloadStarted'));
    } else if (error) {
      toast.error(t('toast.error.downloadWithPreviousError', { error: error }));
    } else {
      toast.info(t('toast.info.pdfLoadingOrUnavailable'));
    }
  };

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
        <Button onClick={handleManualDownload} disabled={isLoading || !pdfBlobUrl || !!error}>
          <Download className="mr-2 h-4 w-4" />
          {t('buttons.download')}
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-lg min-h-[calc(100vh-20rem)] bg-muted/40">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t('statusMessages.generatingPdf')}</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center p-10 border border-dashed border-red-500/50 rounded-lg min-h-[calc(100vh-20rem)] bg-red-50 dark:bg-red-900/20">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-700 dark:text-red-400 font-semibold">{t('statusMessages.errorProcessingPdfTitle')}</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
            {t('buttons.retry')}
          </Button>
        </div>
      )}
      {!isLoading && !error && pdfBlobUrl && (
        <div className="border rounded-lg overflow-hidden shadow-lg bg-background">
          <iframe
            src={pdfBlobUrl}
            className="w-full h-[calc(100vh-15rem)] md:h-[calc(100vh-12rem)]"
            title={t('pdfViewer.title')}
            aria-label={t('pdfViewer.ariaLabel')}
          />
          <p className="p-2 text-xs text-center text-muted-foreground">
            {t('pdfViewer.downloadHint')}
          </p>
        </div>
      )}
      {!isLoading && !error && !pdfBlobUrl && (
        <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-lg min-h-[calc(100vh-20rem)] bg-muted/40">
          <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('statusMessages.pdfNotGenerated')}</p>
        </div>
      )}
    </div>
  );
}
