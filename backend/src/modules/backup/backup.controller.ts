import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as backupService from './backup.service';

export const exportJson = asyncHandler(async (req: Request, res: Response) => {
  const data = await backupService.exportJson(req.user!.id);
  res.status(200).json({ success: true, data });
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const table = req.params.table as backupService.CsvTable;
  const csv = await backupService.exportCsv(req.user!.id, table);
  res
    .setHeader('Content-Type', 'text/csv; charset=utf-8')
    .setHeader('Content-Disposition', `attachment; filename="${table}.csv"`)
    .status(200)
    .send(csv);
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await backupService.restore(req.user!.id, req.body);
  res.status(200).json({
    success: true,
    message: `Restored ${result.categories + result.tasks + result.resources + result.words + result.goals} records (${result.skipped} skipped as duplicates)`,
    data: result,
  });
});
