import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as categoryController from './category.controller';
import { createCategorySchema, updateCategorySchema } from './category.validation';

const router = Router();
router.use(authenticate);

router.get('/', categoryController.list);
router.post('/', validate(createCategorySchema), categoryController.create);
router.put('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', categoryController.remove);

export default router;
