import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as searchService from './search.service';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string) ?? '';
  const typesParam = (req.query.types as string) ?? '';
  const limit = Number(req.query.limit ?? 5);
  const types = typesParam ? typesParam.split(',').filter(Boolean) : undefined;
  const data = await searchService.globalSearch(req.user!.id, q, types, limit);
  res.status(200).json({ success: true, data });
});
