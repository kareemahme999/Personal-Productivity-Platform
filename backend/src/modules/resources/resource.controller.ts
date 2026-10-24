import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as resourceService from './resource.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  const data = await resourceService.listResources(req.user!.id, {
    type: q.type as never,
    categoryId: q.categoryId,
    q: q.q,
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 50),
  });
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const resource = await resourceService.createResource(
    req.user!.id,
    req.body,
    req.file ? { filename: req.file.filename, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : undefined,
  );
  res.status(201).json({ success: true, message: 'Resource saved', data: { resource } });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const resource = await resourceService.updateResource(
    req.params.id,
    req.user!.id,
    req.body,
    req.file ? { filename: req.file.filename, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : undefined,
  );
  res.status(200).json({ success: true, message: 'Resource updated', data: { resource } });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await resourceService.deleteResource(req.params.id, req.user!.id);
  res.status(200).json({ success: true, message: 'Resource deleted', data: null });
});
