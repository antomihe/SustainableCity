// frontend\components\custom\operator\OperatorTasksClientContent.tsx

'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { Task, ContainerStatus, ContainerType } from '@/lib/types'; 
import { createAuthorizedApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations, useFormatter, useLocale } from 'next-intl'; 


const getTaskStyle = (task: Task) => {
  if (task.status === ContainerStatus.DAMAGED) {
    return { color: 'text-red-600 dark:text-red-400', icon: <AlertTriangle className="h-5 w-5" /> };
  }
  if (task.status === ContainerStatus.FULL || task.fillLevel >= 85) {
    return { color: 'text-orange-500 dark:text-orange-400', icon: <Trash2 className="h-5 w-5" /> };
  }
  
  return { color: 'text-yellow-500 dark:text-yellow-400', icon: <Trash2 className="h-5 w-5" /> };
};

export default function OperatorTasksClientContent() {
  const t = useTranslations('OperatorTasksClientContent');
  const tTypes = useTranslations('types'); 

  const locale = useLocale();

  const formatDateTime = useFormatter().dateTime; 

  const { socket } = useSocket();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, startUpdateTransition] = useTransition();


  const fetchTasks = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const authorizedApi = await createAuthorizedApi(locale);
      const response = await authorizedApi.get<Task[]>(`/operator/${user.id}/assigned-containers`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching operator tasks:', error);
      toast.error(t('toast.error.loadTasksFailed'));
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]); 

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewAssignment = (newTask: Task) => {
      toast.info(t('toast.info.newAssignmentTitle'), { description: t('toast.info.newAssignmentDescription', { location: newTask.location }) });
      setTasks((prevTasks) => [newTask, ...prevTasks.filter(t => t.id !== newTask.id)]);
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      toast.info(t('toast.info.taskUpdated', { location: updatedTask.location }));
      setTasks((prevTasks) => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    };
    
    const handleExternalUpdateAndRefetch = () => {        
        fetchTasks();
    };

    socket.on(`newAssignment:${user.id}`, handleNewAssignment);
    socket.on(`taskUpdated:${user.id}`, handleTaskUpdated);
    socket.on('containerUpdated', handleExternalUpdateAndRefetch);
    socket.on('containerDeleted', handleExternalUpdateAndRefetch);

    return () => {
      socket.off(`newAssignment:${user.id}`, handleNewAssignment);
      socket.off(`taskUpdated:${user.id}`, handleTaskUpdated);
      socket.off('containerUpdated', handleExternalUpdateAndRefetch);
      socket.off('containerDeleted', handleExternalUpdateAndRefetch);
    };
  }, [socket, user, t]); 

  const handleMarkAsCompleted = (taskId: string, taskName: string, currentStatus: ContainerStatus) => {
    startUpdateTransition(async () => {
      try {
        const authorizedApi = await createAuthorizedApi(locale);
        let payload: { fillLevel?: number; status?: ContainerStatus } = {};
        let successMessageKey: string;

        if (currentStatus === ContainerStatus.DAMAGED) {
          payload = { status: ContainerStatus.OK, fillLevel: 0 }; 
          successMessageKey = 'toast.success.incidentResolved';
        } else { 
          payload = { fillLevel: 0, status: ContainerStatus.OK };
          successMessageKey = 'toast.success.containerEmptied';
        }
        
        await authorizedApi.patch(`/containers/${taskId}/status`, payload);
        toast.success(t(successMessageKey, { location: taskName }));
        
      } catch (error: any) {
        console.error('Error updating task status:', error);
        toast.error(error.response?.data?.message || t('toast.error.updateTaskFailed'));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
            <CardContent><div className="h-4 bg-muted rounded w-full mb-2"></div><div className="h-4 bg-muted rounded w-1/2"></div></CardContent>
            <CardFooter><div className="h-10 bg-muted rounded w-full"></div></CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="mt-4">{t('noTasks.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('noTasks.description')}</p>
        </CardContent>
        <CardFooter className="justify-center"> 
          <Button onClick={() => fetchTasks()} variant="outline" disabled={isUpdating || isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('noTasks.reloadButton')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const style = getTaskStyle(task);
        const taskStatusText = tTypes(`containerStatuses.${task.status as ContainerStatus}`);
        const taskContainerTypeText = tTypes(`containerTypes.${task.containerType as ContainerType}`);
        
        return (
          <Card
            key={task.id}
            className={`border-l-4 shadow-md rounded-2xl transition-all duration-300 ${task.status === ContainerStatus.DAMAGED
              ? 'border-red-500'
              : task.status === ContainerStatus.FULL || task.fillLevel >= 85
                ? 'border-orange-500'
                : 'border-yellow-500' 
              }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${style.color}`}>
                    {style.icon}
                    <span>{task.location}</span>
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    <div className="leading-snug">
                      <p><span className="font-medium">{t('taskCard.labels.fillLevel')}:</span> {task.fillLevel}%</p>
                      <p><span className="font-medium">{t('taskCard.labels.status')}:</span> {taskStatusText}</p>
                      {task.description && <p><span className="font-medium">{t('taskCard.labels.taskDescription')}:</span> {task.description}</p>}
                    </div>
                  </CardDescription>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{t('taskCard.labels.containerType')}: {taskContainerTypeText}</span>
              </div>
            </CardHeader>

            <CardFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4"> {/* Añadido pt-4 */}
              <p className="text-xs text-muted-foreground">
                {t('taskCard.lastUpdatedLabel')}:{" "}
                {formatDateTime(new Date(task.lastUpdated), {
                  year: "numeric", month: "short", day: "numeric",
                  hour: "numeric", minute: "numeric", hour12: false
                })}
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    disabled={isUpdating}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('taskCard.buttons.markAsManaged')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader> 
                    <AlertDialogTitle>{t('alertDialog.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('alertDialog.description', { 
                        location: task.location, 
                        status: tTypes('containerStatuses.OK'), 
                        fillLevel: 0 
                      })}
                      {task.status === ContainerStatus.DAMAGED && " " + t('alertDialog.incidentResolvedNote')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isUpdating}>{t('alertDialog.buttons.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleMarkAsCompleted(task.id, task.location, task.status)}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUpdating ? t('alertDialog.buttons.updating') : t('alertDialog.buttons.confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}