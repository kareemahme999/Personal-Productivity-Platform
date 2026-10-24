import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as taskService from './task.service';
import type { ListTasksQuery } from './task.validation';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListTasksQuery;
  const data = await taskService.listTasks(req.user!.id, {
    status: q.status,
    priority: q.priority,
    categoryId: q.categoryId,
    q: q.q,
    dueFrom: q.dueFrom ? new Date(q.dueFrom) : null,
    dueTo: q.dueTo ? new Date(q.dueTo) : null,
    completed: q.completed,
    page: q.page,
    limit: q.limit,
  });
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await taskService.getTask(req.user!.id, req.params.id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await taskService.createTask(req.user!.id, req.body);
  res.status(201).json({ success: true, message: 'Task created', data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await taskService.updateTask(req.user!.id, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Task updated', data });
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
  const completed = req.body.completed !== false;
  const task = await taskService.setCompleted(req.user!.id, req.params.id, completed);
  res.status(200).json({
    success: true,
    message: completed ? 'Task completed 🎉' : 'Task reopened',
    data: { task },
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const mode = req.query.mode === 'series' ? 'series' : 'this';
  const result = await taskService.deleteTask(req.user!.id, req.params.id, mode);
  res.status(200).json({ success: true, message: result.series ? 'Task series deleted' : 'Task deleted', data: null });
});

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { prisma } = await import('../../lib/prisma');
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    return;
  }
  const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!task) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    return;
  }
  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId: task.id,
      userId: req.user!.id,
      fileName: file.originalname,
      filePath: `${process.env.UPLOAD_DIR ?? 'uploads'}/tasks/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
    },
  });
  res.status(201).json({ success: true, message: 'Attachment uploaded', data: { attachment } });
});

export const removeAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { prisma } = await import('../../lib/prisma');
  const { taskId, attachmentId } = req.params;
  const attachment = await prisma.taskAttachment.findFirst({
    where: { id: attachmentId, taskId, userId: req.user!.id },
  });
  if (!attachment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attachment not found' } });
    return;
  }
  await prisma.taskAttachment.delete({ where: { id: attachmentId } });
  res.status(200).json({ success: true, message: 'Attachment removed', data: null });
});
