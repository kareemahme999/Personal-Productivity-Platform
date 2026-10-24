import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as goalService from './goal.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  const data = await goalService.listGoals(req.user!.id, {
    status: q.status as never,
    q: q.q,
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 100),
  });
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const goal = await goalService.createGoal(req.user!.id, req.body);
  res.status(201).json({ success: true, message: 'Goal created', data: { goal } });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const goal = await goalService.updateGoal(req.params.id, req.user!.id, req.body);
  res.status(200).json({ success: true, message: 'Goal updated', data: { goal } });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await goalService.deleteGoal(req.params.id, req.user!.id);
  res.status(200).json({ success: true, message: 'Goal deleted', data: null });
});
