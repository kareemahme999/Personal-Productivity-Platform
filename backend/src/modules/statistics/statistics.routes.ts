import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as statisticsController from './statistics.controller';

const router = Router();
router.use(authenticate);

router.get('/dashboard', statisticsController.dashboard);
router.get('/tasks', statisticsController.tasks);
router.get('/productivity', statisticsController.productivity);
router.get('/vocabulary', statisticsController.vocabulary);

export default router;
