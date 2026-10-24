import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as backupController from './backup.controller';
import { CSV_TABLES } from './backup.service';

const router = Router();
router.use(authenticate);

router.get('/export', backupController.exportJson);
router.get('/export/:table/csv', (req, res, next) => {
  const { table } = req.params;
  if (!(CSV_TABLES as readonly string[]).includes(table)) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Unsupported table' } });
    return;
  }
  next();
}, backupController.exportCsv);
router.post('/restore', backupController.restore);

export default router;
