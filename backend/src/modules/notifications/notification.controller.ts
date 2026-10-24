import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { getReminders } from './notification.service';

export const reminders = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getReminders(res.locals.userId ?? _req.user!.id);
  res.status(200).json({ success: true, data });
});
