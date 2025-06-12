// frontend\components\custom\admin\containers\AdminContainersClientPage.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createAuthorizedApi } from '@/lib/api';
import { toast } from 'sonner';
import { Container, User, UserRole, ContainerType, ContainerStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Users, Trash2, MapPin, File, Loader2, PlusCircle, QrCode } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ContainerForm from './ContainerForm';
import AssignOperatorsToContainerDialog from './AssignOperatorsToContainerDialog';
import { useTranslations, useLocale } from 'next-intl';

type ContainerWithOperators = Container & { operators?: User[] };

export default function AdminContainersClientPage() {
  const t = useTranslations('AdminContainersClientPage');
  const tTypes = useTranslations('types');

  const locale = useLocale();
  const dateLocale = locale === 'es' ? es : enUS;

  const [containers, setContainers] = useState<ContainerWithOperators[]>([]);
  const [allOperators, setAllOperators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<Container | null>(null);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assigningToContainer, setAssigningToContainer] = useState<Container | null>(null);

  const [isGeneratingStatusPdf, setIsGeneratingStatusPdf] = useState(false);
  const [isGeneratingQrPdf, setIsQrPdfGenerating] = useState(false);

  const fetchContainers = useCallback(async (showToast = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const authorizedApi = await createAuthorizedApi(locale);
      const response = await authorizedApi.get<Container[]>('/containers');
      const containersData: ContainerWithOperators[] = await Promise.all(
        response.data.map(async (container) => {
          let operators: User[] = [];
          try {
            if (container.id) {
              const res = await authorizedApi.get<User[]>(`/assignments/container/${container.id}`);
              operators = res.data;
            }
          } catch { operators = []; }
          return { ...container, operators };
        })
      );
      setContainers(containersData);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('toast.error.loadContainersFailed');
      setError(msg);
      if (showToast) toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const fetchAllOperators = useCallback(async () => {
    try {
      const authorizedApi = await createAuthorizedApi(locale);
      const response = await authorizedApi.get<User[]>('/users/operator');
      setAllOperators(response.data.filter(user => user.role === UserRole.Operator));
    } catch (error) {
      toast.error(t('toast.error.loadOperatorsFailed'));
    }
  }, [t]);

  useEffect(() => {
    fetchContainers();
    fetchAllOperators();
  }, [fetchContainers, fetchAllOperators]);

  const handleCreateNewContainer = () => {
    setEditingContainer(null);
    setIsCreateEditDialogOpen(true);
  };

  const handleEditContainer = (container: Container) => {
    setEditingContainer(container);
    setIsCreateEditDialogOpen(true);
  };

  const handleOpenAssignOperatorsDialog = (container: Container) => {
    setAssigningToContainer(container);
    setIsAssignDialogOpen(true);
  };

  const handleDeleteContainer = useCallback(async (containerId: string) => {
    // if (!window.confirm(t('deleteConfirmation.message'))) return;
    try {
      const authorizedApi = await createAuthorizedApi(locale);
      await authorizedApi.delete(`/containers/${containerId}`);
      toast.success(t('toast.success.containerDeleted'));
      fetchContainers(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('toast.error.deleteContainerFailed');
      toast.error(msg);
    }
  }, [fetchContainers, t]);

  const handleContainerFormSuccess = (createdUpdatedContainer: Container) => {
    setIsCreateEditDialogOpen(false);
    setAssigningToContainer(createdUpdatedContainer);
    setIsAssignDialogOpen(true);
    fetchContainers(true);
  }

  const handleAssignmentSuccess = () => {
    setIsAssignDialogOpen(false);
    setAssigningToContainer(null);
    fetchContainers(true);
  };

  const handleGeneratePdf = async (endpoint: string, setIsGenerating: (isGenerating: boolean) => void, successMessageKey: string, defaultFileName: string) => {
    try {
      setIsGenerating(true);
      const authorizedApi = await createAuthorizedApi(locale);
      const response = await authorizedApi.get(endpoint, { responseType: 'blob' });
      if (!response.status || response.status < 200 || response.status >= 300) {
        throw new Error(t('toast.error.pdfGenerationFailed', { status: response.status }));
      }
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'];
      let filename = defaultFileName;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t(successMessageKey as any));
    } catch (error: any) {
      toast.error(error.message || t('toast.error.pdfDefaultError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const columns = useMemo((): ColumnDef<ContainerWithOperators>[] => [
    {
      accessorKey: "location",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t('columns.location')} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("location")}</div>,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t('columns.type')} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const typeValue = row.getValue("type") as ContainerType;
        return typeValue ? tTypes(`containerTypes.${typeValue}`) : t('columns.notAvailable');
      }
    },
    {
      accessorKey: "status",
      header: t('columns.status'),
      cell: ({ row }) => {
        const status = row.getValue("status") as ContainerStatus;
        const statusText = status ? tTypes(`containerStatuses.${status}`) : t('columns.notAvailable');
        let variant: "default" | "destructive" | "outline" | "secondary" = "secondary";
        if (status === ContainerStatus.FULL) variant = "destructive";
        else if (status === ContainerStatus.OK) variant = "default";
        else if (status === ContainerStatus.DAMAGED) variant = "outline";
        return <Badge variant={variant} className={status === ContainerStatus.OK ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300" : ""}>{statusText}</Badge>;
      }
    },
    {
      accessorKey: "fillLevel",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t('columns.fillLevel')} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-center">{row.getValue("fillLevel")}%</div>,
    },
    {
      accessorKey: "operators",
      header: t('columns.assignedOperators'),
      cell: ({ row }) => {
        const operators = row.original.operators as User[] | undefined;
        if (!operators || operators.length === 0) {
          return <span className="text-xs text-muted-foreground italic">{t('columns.noneAssigned')}</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {operators.slice(0, 2).map(op => (
              <Badge key={op.id} variant="secondary" className="text-xs">
                {op.name || op.email.split('@')[0]}
              </Badge>
            ))}
            {operators.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                {t('columns.moreOperators', { count: operators.length - 2 })}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "updatedAt",
      header: t('columns.lastUpdated'),
      cell: ({ row }) => {
        const date = row.getValue("updatedAt");
        return date ? format(new Date(date as string), "dd MMM, HH:mm", { locale: dateLocale }) : t('columns.notAvailable');
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('columns.actions.header')}</div>,
      cell: ({ row }) => {
        const container = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t('columns.actions.openMenu')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('columns.actions.label')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEditContainer(container)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" /> {t('columns.actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenAssignOperatorsDialog(container)} className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" /> {t('columns.actions.assign')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`https://www.google.com/maps?q=${container.coordinates?.lat},${container.coordinates?.lng}`, '_blank')} className="cursor-pointer" disabled={!container.coordinates}>
                  <MapPin className="mr-2 h-4 w-4" /> {t('columns.actions.viewOnMap')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteContainer(container.id)}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-800/30"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {t('columns.actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
    },
  ], [t, tTypes, dateLocale, handleDeleteContainer, handleEditContainer, handleOpenAssignOperatorsDialog]);


  if (error && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => fetchContainers(true)} className="mt-4">{t('retryButton')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-4">
        <Dialog open={isCreateEditDialogOpen} onOpenChange={(isOpen) => {
          setIsCreateEditDialogOpen(isOpen);
          if (!isOpen) setEditingContainer(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNewContainer} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('buttons.createContainer')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingContainer ? t('dialogs.editContainer.title') : t('dialogs.createContainer.title')}
              </DialogTitle>
              <DialogDescription>
                {editingContainer ? t('dialogs.editContainer.description') : t('dialogs.createContainer.description')}
              </DialogDescription>
            </DialogHeader>
            <ContainerForm
              container={editingContainer}
              onSuccess={handleContainerFormSuccess}
              onCancel={() => {
                setIsCreateEditDialogOpen(false);
                setEditingContainer(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <div className='flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto'>
          <Button
            onClick={() => handleGeneratePdf('admin/reports/container-qr-codes', setIsQrPdfGenerating, 'toast.success.qrPdfGenerated', `container-qr-codes.pdf`)}
            disabled={isGeneratingQrPdf}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isGeneratingQrPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
            {isGeneratingQrPdf ? t('buttons.generatingPdf') : t('buttons.generateQrPdf')}
          </Button>
          <Button
            onClick={() => handleGeneratePdf('admin/reports/container-status', setIsGeneratingStatusPdf, 'toast.success.statusPdfGenerated', `container-status.pdf`)}
            disabled={isGeneratingStatusPdf}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isGeneratingStatusPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <File className="mr-2 h-4 w-4" />}
            {isGeneratingStatusPdf ? t('buttons.generatingPdf') : t('buttons.generateStatusPdf')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={containers}
        isLoading={isLoading && containers.length === 0}
        searchPlaceholder={t('dataTable.searchPlaceholder')}
        filterColumns={['location', 'type', 'status']}
        showSearch
        noResultsText={t('dataTable.noResults')}
      />

      {assigningToContainer && (
        <AssignOperatorsToContainerDialog
          isOpen={isAssignDialogOpen}
          setIsOpen={(isOpen) => {
            setIsAssignDialogOpen(isOpen);
            if (!isOpen) setAssigningToContainer(null);
          }}
          container={assigningToContainer}
          allOperators={allOperators}
          onAssignmentSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
} 