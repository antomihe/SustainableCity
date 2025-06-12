// frontend\components\custom\admin\operators\AssignContainersDialog.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Operator, Container, ContainerType } from '@/lib/types'; 
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createAuthorizedApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface AssignContainersDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  operator: Operator;
  allContainers: Container[];
  onAssignmentSuccess: () => void;
}

export default function AssignContainersDialog({
  isOpen,
  setIsOpen,
  operator,
  allContainers,
  onAssignmentSuccess,
}: AssignContainersDialogProps) {
  const t = useTranslations('AssignContainersDialog');
  const tContainerTypes = useTranslations('types.containerTypes'); 

  const locale = useLocale();

  const [assignedContainerIds, setAssignedContainerIds] = useState<Set<string>>(new Set());
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && operator) {
      const fetchAssigned = async () => {
        setIsLoadingAssigned(true);
        try {
          const authorizedApi = await createAuthorizedApi(locale);
          const response = await authorizedApi.get<Container[]>(`/assignments/operator/${operator.id}`);
          setAssignedContainerIds(new Set(response.data.map(c => c.id)));
        } catch (error) {
          console.error("Error fetching assigned containers:", error);
          toast.error(t('toast.error.loadAssignedFailed'));
        } finally {
          setIsLoadingAssigned(false);
        }
      };
      fetchAssigned();
    }
  }, [isOpen, operator, t]); 

  const handleToggleContainer = (containerId: string) => {
    setAssignedContainerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(containerId)) {
        newSet.delete(containerId);
      } else {
        newSet.add(containerId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allIds = allContainers.map(c => c.id);
    setAssignedContainerIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setAssignedContainerIds(new Set());
  };

  const areAllSelected = allContainers.length > 0 &&
    allContainers.every(container => assignedContainerIds.has(container.id));

  const handleToggleAll = () => {
    if (areAllSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      try {
        const authorizedApi = await createAuthorizedApi(locale);
        await authorizedApi.put(`assignments/operator/${operator.id}`, {
          containerIds: Array.from(assignedContainerIds),
        });
                
        toast.success(t('toast.success.assignmentUpdated', { operatorName: operator.name || operator.email }));
        onAssignmentSuccess();
        setIsOpen(false);
      } catch (error: any) {
        console.error("Error updating assigned containers:", error);
        toast.error(error.response?.data?.message || t('toast.error.updateFailed'));
      }
    });
  };

  
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('header.title', { operatorName: operator.name || operator.email })}</DialogTitle>
          <DialogDescription>
            {t('header.description')}
          </DialogDescription>
        </DialogHeader>

        {isLoadingAssigned ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2 text-sm text-muted-foreground">{t('loadingAssignments')}</p>
          </div>
        ) : (
          <>
            {allContainers.length > 0 && (
              <div className="flex justify-end mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAll}
                  disabled={isSubmitting}
                >
                  {areAllSelected ? t('buttons.deselectAll') : t('buttons.selectAll')}
                </Button>
              </div>
            )}

            <ScrollArea className="h-72 mb-4 border rounded-md"> 
              <div className="p-4 space-y-2">
                {allContainers.length > 0 ? (
                  allContainers.map(container => (
                    <div key={container.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`container-${container.id}-for-operator-${operator.id}`} 
                        checked={assignedContainerIds.has(container.id)}
                        onCheckedChange={() => handleToggleContainer(container.id)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`container-${container.id}-for-operator-${operator.id}`} className="flex-grow cursor-pointer">
                        {container.location}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({tContainerTypes(container.type as keyof typeof ContainerType)})
                        </span>
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('noContainersToAssign')}
                  </p>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsOpen(false)}>
              {t('buttons.cancel')}
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoadingAssigned || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t('buttons.saving') : t('buttons.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}