// frontend\components\custom\admin\operators\OperatorsClientPage.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createAuthorizedApi } from '@/lib/api';
import { toast } from 'sonner';
import { Operator, UserRole, Container } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, ListTodo, Trash2, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
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
import OperatorForm from './OperatorForm';
import AssignContainersDialog from './AssignContainersDialog';
import { useTranslations, useLocale } from 'next-intl';

export default function OperatorsClientPage() {
  const t = useTranslations('AdminOperatorsClientPage');

  const locale = useLocale();
  const dateLocale = locale === 'es' ? es : enUS;

  const [operators, setOperators] = useState<Operator[]>([]);
  const [allContainers, setAllContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assigningOperator, setAssigningOperator] = useState<Operator | null>(null);

  const fetchOperators = useCallback(async (showToast = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const authorizedApi = await createAuthorizedApi(locale);
      const response = await authorizedApi.get<Operator[]>('/users/operator');
      setOperators(response.data);
      if (showToast) toast.success(t('toast.success.operatorsUpdated'));
    } catch (err: any) {
      const msg = err.response?.data?.message || t('toast.error.loadOperatorsFailed');
      setError(msg);
      if (showToast) toast.error(msg);
    } finally {
      setIsLoading(false); 
    }
  }, [t]);

  const fetchAllContainers = useCallback(async () => {
    try {
      const authorizedApi = await createAuthorizedApi(locale);
      const response = await authorizedApi.get<Container[]>('/containers');
      setAllContainers(response.data);
    } catch (error) {
      toast.error(t('toast.error.loadContainersFailed'));
    }
  }, [t]);

  useEffect(() => {
    fetchOperators();
    fetchAllContainers();
  }, [fetchOperators, fetchAllContainers]);

  const handleCreateNewOperator = () => {
    setEditingOperator(null);
    setIsCreateEditDialogOpen(true);
  };

  const handleEditOperator = (operator: Operator) => {
    setEditingOperator(operator);
    setIsCreateEditDialogOpen(true);
  };

  const handleAssignContainers = (operator: Operator) => {
    setAssigningOperator(operator);
    setIsAssignDialogOpen(true);
  };

  const handleDeleteOperator = useCallback(async (operatorId: string) => {
    // if (!window.confirm(t('deleteConfirmation.message'))) return;
    try {
      const authorizedApi = await createAuthorizedApi();
      await authorizedApi.delete(`/users/${operatorId}`);
      toast.success(t('toast.success.operatorDeleted'));
      fetchOperators(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('toast.error.deleteOperatorFailed');
      toast.error(msg);
    }
  }, [fetchOperators, t]);

  const handleFormSuccess = (createdOrUpdatedOperator: Operator) => {
    setIsCreateEditDialogOpen(false);
    setAssigningOperator(createdOrUpdatedOperator);
    setIsAssignDialogOpen(true);
    fetchOperators(true);
  };

  const handleAssignmentSuccess = () => {
    setIsAssignDialogOpen(false);
    setAssigningOperator(null);
    fetchOperators(true);
    toast.success(t('toast.success.containersAssigned'));
  };

  const columns = useMemo((): ColumnDef<Operator>[] => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('columns.name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name") || t('columns.notAvailable')}</div>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('columns.email')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.getValue("email"),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('columns.createdAt')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt");
        return date ? format(new Date(date as string), "dd MMM, yyyy", { locale: dateLocale }) : t('columns.notAvailable');
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('columns.verifiedStatus')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const isVerified = row.getValue("isActive") as boolean;
        return (
          <Checkbox
            checked={isVerified}
            disabled
            aria-label={isVerified ? t('columns.verified') : t('columns.notVerified')}
          />
        );
      },
      enableSorting: true,
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('columns.actions.header')}</div>,
      cell: ({ row }) => {
        const operator = row.original;
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
                <DropdownMenuItem onClick={() => handleEditOperator(operator)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  {t('columns.actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAssignContainers(operator)} className="cursor-pointer">
                  <ListTodo className="mr-2 h-4 w-4" />
                  {t('columns.actions.assignContainers')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteOperator(operator.id)}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-800/30"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('columns.actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
    },
  ], [t, dateLocale, handleDeleteOperator, handleEditOperator, handleAssignContainers]);


  if (error && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => fetchOperators(true)} className="mt-4">{t('retryButton')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateEditDialogOpen} onOpenChange={(isOpen) => {
          setIsCreateEditDialogOpen(isOpen);
          if (!isOpen) setEditingOperator(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNewOperator}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('buttons.createOperator')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingOperator ? t('dialogs.editOperator.title') : t('dialogs.createOperator.title')}
              </DialogTitle>
              <DialogDescription>
                {editingOperator ? t('dialogs.editOperator.description') : t('dialogs.createOperator.description')}
              </DialogDescription>
            </DialogHeader>
            <OperatorForm
              operator={editingOperator}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setIsCreateEditDialogOpen(false);
                setEditingOperator(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={operators}
        isLoading={isLoading && operators.length === 0}
        showSearch={true}
        filterColumns={['name', 'email']}
        searchPlaceholder={t('dataTable.searchPlaceholder')}
        noResultsText={t('dataTable.noResults')}
      />

      {assigningOperator && (
        <AssignContainersDialog
          isOpen={isAssignDialogOpen}
          setIsOpen={(isOpen) => {
            setIsAssignDialogOpen(isOpen);
            if (!isOpen) setAssigningOperator(null);
          }}
          operator={assigningOperator}
          allContainers={allContainers}
          onAssignmentSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
}