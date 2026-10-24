import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { Category, Task } from '@/types';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TaskForm } from './TaskForm';
import { useToast } from '@/components/ui/Toast';

export function TaskModal({
  open,
  onClose,
  task,
  categories,
  defaultDueDate,
}: {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  categories: Category[];
  defaultDueDate?: string;
}) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleSaved = () => {
    invalidate();
    success(task ? 'Task updated' : 'Task created');
    onClose();
  };

  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await tasksApi.remove(task.id, 'this');
      invalidate();
      success('Task deleted');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={task ? 'Edit task' : 'New task'}
        description={task?.recurrence !== 'NONE' && task ? 'Recurring task — changes can apply to this occurrence or the whole series' : undefined}
        size="lg"
      >
        <TaskForm
          key={task?.id ?? `new-${defaultDueDate ?? 'x'}`}
          task={task ?? undefined}
          categories={categories}
          showApplyTo={task?.recurrence !== 'NONE'}
          initialDueDate={defaultDueDate}
          onSaved={handleSaved}
          onCancel={onClose}
        />
        {task && (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/5">
            <button onClick={() => setConfirmDelete(true)} className="text-sm font-medium text-red-500 hover:underline">
              Delete task…
            </button>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete task?"
        message={
          task?.recurrence !== 'NONE' && !task?.seriesId
            ? 'This is a recurring task template. Deleting it will permanently remove the template and all occurrences.'
            : task?.seriesId
            ? 'This task will be permanently removed. Only this occurrence is affected.'
            : 'This task will be permanently removed.'
        }
      />
    </>
  );
}
