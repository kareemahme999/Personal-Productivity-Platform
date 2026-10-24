import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as statisticsService from './statistics.service';

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await statisticsService.dashboard(req.user!.id);
  res.status(200).json({ success: true, data });
});

export const tasks = asyncHandler(async (req: Request, res: Response) => {
  const data = await statisticsService.taskStats(req.user!.id);
  res.status(200).json({ success: true, data });
});

export const productivity = asyncHandler(async (req: Request, res: Response) => {
  const data = await statisticsService.productivity(req.user!.id);
  res.status(200).json({ success: true, data });
});

export const vocabulary = asyncHandler(async (req: Request, res: Response) => {
  const data = await statisticsService.vocabularyStats(req.user!.id);
  res.status(200).json({ success: true, data });
});
