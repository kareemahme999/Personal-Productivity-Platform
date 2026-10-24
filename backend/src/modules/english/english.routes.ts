import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as englishController from './english.controller';
import {
  createWordSchema,
  listWordsSchema,
  quizQuestionsSchema,
  submitQuizSchema,
  updateWordSchema,
} from './english.validation';

const router = Router();
router.use(authenticate);

router.get('/words', validate(listWordsSchema, 'query'), englishController.list);
router.get('/words/categories', englishController.categories);
router.get('/words/word-of-day', englishController.wordOfDay);
router.post('/words', validate(createWordSchema), englishController.create);
router.put('/words/:id', validate(updateWordSchema), englishController.update);
router.patch('/words/:id/learned', validate(updateWordSchema.pick({ isLearned: true, isFavorite: true })), englishController.learned);
router.delete('/words/:id', englishController.remove);

router.get('/quiz/questions', validate(quizQuestionsSchema, 'query'), englishController.quizQuestions);
router.post('/quiz/submit', validate(submitQuizSchema), englishController.quizSubmit);
router.get('/quiz/history', englishController.quizHistory);

export default router;
