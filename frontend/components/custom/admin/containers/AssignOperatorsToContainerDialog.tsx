// frontend\components\custom\admin\containers\AssignOperatorsToContainerDialog.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Container, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createAuthorizedApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface ContainerWithOperators extends Container {
  assignedToOperators?: User[];
}

interface AssignOperatorsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  container: ContainerWithOperators;
  allOperators: User[];
  onAssignmentSuccess: () => void;
}

export default function AssignOperatorsToContainerDialog({
  isOpen,
  setIsOpen,
  container,
  allOperators,
  onAssignmentSuccess,
}: AssignOperatorsDialogProps) {
  const t = useTranslations('AssignOperatorsToContainerDialog');

  const locale = useLocale();

  const [selectedOperatorIds, setSelectedOperatorIds] = useState<Set<string>>(new Set());
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    const fetchAssignedOperators = async () => {
      try {
        const authorizedApi = await createAuthorizedApi(locale);
        const { data } = await authorizedApi.get<User[]>(`/assignments/container/${container.id}`);
        setSelectedOperatorIds(new Set(data.map(op => op.id)));
      } catch (error) {
        toast.error(t('toast.error.fetchAssignedFailed'));
        setSelectedOperatorIds(new Set());
      } finally {
        setIsLoadingCurrent(false);
      }
    };

    if (isOpen && container) {
      setIsLoadingCurrent(true);
      if (container.assignedToOperators) { 
        setSelectedOperatorIds(new Set(container.assignedToOperators.map(op => op.id)));
        setIsLoadingCurrent(false);
      } else { 
        fetchAssignedOperators();
      }
    }
  }, [isOpen, container, t]);

  const handleToggleOperator = (operatorId: string) => {
    setSelectedOperatorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(operatorId)) {
        newSet.delete(operatorId);
      } else {
        newSet.add(operatorId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      try {
        const authorizedApi = await createAuthorizedApi(locale);
        await authorizedApi.put(`/assignments/container/${container.id}`, {
          operatorIds: Array.from(selectedOperatorIds),
        });
        toast.success(t('toast.success.assignmentUpdated', { location: container.location }));
        onAssignmentSuccess();
        setIsOpen(false);
      } catch (error: any) {
        toast.error(error.response?.data?.message || t('toast.error.updateFailed'));
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title', { location: container.location })}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        {isLoadingCurrent ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2 text-sm text-muted-foreground">{t('loadingOperators')}</p>
          </div>
        ) : (
          <ScrollArea className="h-72 my-4 border rounded-md">
            <div className="p-4 space-y-2">
              {allOperators.length > 0 ? allOperators.map(operator => (
                <div key={operator.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`operator-${operator.id}-for-${container.id}`}
                    checked={selectedOperatorIds.has(operator.id)}
                    onCheckedChange={() => handleToggleOperator(operator.id)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor={`operator-${operator.id}-for-${container.id}`}
                    className="flex-grow cursor-pointer"
                  >
                    {operator.name || operator.email} 
                  </Label>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noOperatorsAvailable')}
                </p>
              )}
            </div>
          </ScrollArea>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsOpen(false)}> {/* onClick para asegurar cierre si se clickea Cancelar */}
              {t('cancelButton')}
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoadingCurrent || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t('savingButton') : t('saveButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}