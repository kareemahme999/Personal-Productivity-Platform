import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as goalController from './goal.controller';
import { createGoalSchema, listGoalsSchema, updateGoalSchema } from './goal.validation';

const router = Router();
router.use(authenticate);

router.get('/', validate(listGoalsSchema, 'query'), goalController.list);
router.post('/', validate(createGoalSchema), goalController.create);
router.put('/:id', validate(updateGoalSchema), goalController.update);
router.delete('/:id', goalController.remove);

export default router;
