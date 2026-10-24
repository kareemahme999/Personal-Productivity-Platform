import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createUploader } from '../../middlewares/upload';
import * as taskController from './task.controller';
import { completeTaskSchema, createTaskSchema, listTasksSchema, updateTaskSchema } from './task.validation';

const router = Router();
router.use(authenticate);

const attachmentUploader = createUploader('tasks');

router.get('/', validate(listTasksSchema, 'query'), taskController.list);
router.get('/:id', taskController.getOne);
router.post('/', validate(createTaskSchema), taskController.create);
router.put('/:id', validate(updateTaskSchema), taskController.update);
router.patch('/:id/complete', validate(completeTaskSchema), taskController.complete);
router.delete('/:id', taskController.remove);

router.post('/:id/attachments', attachmentUploader.single('file'), taskController.uploadAttachment);
router.delete('/:id/attachments/:attachmentId', taskController.removeAttachment);

export default router;
