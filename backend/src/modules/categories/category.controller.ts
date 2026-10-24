import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as categoryService from './category.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.listCategories(req.user!.id);
  res.status(200).json({ success: true, data: { categories: data } });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.user!.id, req.body);
  res.status(201).json({ success: true, message: 'Category created', data: { category } });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.user!.id, req.body);
  res.status(200).json({ success: true, message: 'Category updated', data: { category } });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id, req.user!.id);
  res.status(200).json({ success: true, message: 'Category deleted', data: null });
});
