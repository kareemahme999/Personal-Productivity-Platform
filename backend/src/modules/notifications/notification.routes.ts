import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as notificationController from './notification.controller';

const router = Router();
router.use(authenticate);

router.get('/', notificationController.reminders);

export default router;
