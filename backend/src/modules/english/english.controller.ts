import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as englishService from './english.service';
import type { ListWordsQuery } from './english.validation';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListWordsQuery;
  const data = await englishService.listWords(req.user!.id, {
    q: q.q,
    category: q.category,
    favorite: q.favorite,
    learned: q.learned,
    random: q.random === 'true',
    page: q.page,
    limit: q.limit,
  });
  res.status(200).json({ success: true, data });
});

export const categories = asyncHandler(async (req: Request, res: Response) => {
  const data = await englishService.getCategories(req.user!.id);
  res.status(200).json({ success: true, data: { categories: data } });
});

export const wordOfDay = asyncHandler(async (req: Request, res: Response) => {
  const word = await englishService.getWordOfDay(req.user!.id);
  res.status(200).json({ success: true, data: { word } });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const word = await englishService.createWord(req.user!.id, req.body);
  res.status(201).json({ success: true, message: 'Word added to your vocabulary', data: { word } });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const word = await englishService.updateWord(req.params.id, req.user!.id, req.body);
  res.status(200).json({ success: true, message: 'Word updated', data: { word } });
});

export const learned = asyncHandler(async (req: Request, res: Response) => {
  const word = await englishService.setLearned(req.params.id, req.user!.id, req.body);
  res.status(200).json({ success: true, message: req.body.isLearned ? 'Marked as learned' : 'Updated', data: { word } });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await englishService.deleteWord(req.params.id, req.user!.id);
  res.status(200).json({ success: true, message: 'Word deleted', data: null });
});

export const quizQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { count, mode } = req.query as { count: string; mode: string };
  const questions = await englishService.generateQuizQuestions(req.user!.id, Number(count ?? 10), mode ?? 'all');
  res.status(200).json({ success: true, data: { questions } });
});

export const quizSubmit = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await englishService.submitQuiz(req.user!.id, req.body);
  res.status(201).json({ success: true, message: 'Quiz saved', data: { attempt } });
});

export const quizHistory = asyncHandler(async (req: Request, res: Response) => {
  const attempts = await englishService.quizHistory(req.user!.id);
  res.status(200).json({ success: true, data: { attempts } });
});
