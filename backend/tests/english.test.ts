import request from 'supertest';
import { app, auth, registerUser } from './helpers';

describe('English vocabulary', () => {
  it('creates a word', async () => {
    const user = await registerUser('Word Creator');
    const res = await request(app)
      .post('/api/english/words')
      .set(auth(user.token))
      .send({ word: 'Resilient', meaning: 'مرن / صامد', exampleSentence: 'She is very resilient.', pronunciation: '/rɪˈzɪliənt/' });
    expect(res.status).toBe(201);
    expect(res.body.data.word.word).toBe('Resilient');
  });

  it('rejects duplicate words', async () => {
    const user = await registerUser('Word Dupe');
    await request(app).post('/api/english/words').set(auth(user.token)).send({ word: 'Brave', meaning: 'شجاع' });
    const res = await request(app).post('/api/english/words').set(auth(user.token)).send({ word: 'Brave', meaning: 'شجاع' });
    expect(res.status).toBe(409);
  });

  it('marks a word as learned', async () => {
    const user = await registerUser('Word Learner');
    const created = await request(app).post('/api/english/words').set(auth(user.token)).send({ word: 'Fluent', meaning: 'طلق اللسان' });
    const id = created.body.data.word.id;

    const res = await request(app).patch(`/api/english/words/${id}/learned`).set(auth(user.token)).send({ isLearned: true });
    expect(res.status).toBe(200);
    expect(res.body.data.word.isLearned).toBe(true);
  });

  it('filters words by favorite and search', async () => {
    const user = await registerUser('Word Lister');
    const a = await request(app).post('/api/english/words').set(auth(user.token)).send({ word: 'Zenith', meaning: 'ذروة', isFavorite: true });
    await request(app).post('/api/english/words').set(auth(user.token)).send({ word: 'Abyss', meaning: 'هاوية' });

    const favorites = await request(app).get('/api/english/words?favorite=true').set(auth(user.token));
    expect(favorites.body.data.words).toHaveLength(1);
    expect(favorites.body.data.words[0].word).toBe('Zenith');

    const search = await request(app).get('/api/english/words?q=zenith').set(auth(user.token));
    expect(search.body.data.words[0].id).toBe(a.body.data.word.id);
  });

  it('returns word of the day and random word', async () => {
    const user = await registerUser('Word Daily');
    await request(app).post('/api/english/words').set(auth(user.token)).send({ word: 'Daily1', meaning: 'معنى ١' });

    const wod = await request(app).get('/api/english/words/word-of-day').set(auth(user.token));
    expect(wod.status).toBe(200);

    const random = await request(app).get('/api/english/words?random=true').set(auth(user.token));
    expect(random.status).toBe(200);
  });

  it('runs a full quiz flow (questions + submit + history)', async () => {
    const user = await registerUser('Quiz Taker');
    for (const w of [
      { word: 'Alpha', meaning: 'ألفا' },
      { word: 'Beta', meaning: 'بيتا' },
      { word: 'Gamma', meaning: 'غاما' },
    ]) {
      await request(app).post('/api/english/words').set(auth(user.token)).send(w);
    }

    const questions = await request(app).get('/api/english/quiz/questions?count=3&mode=all').set(auth(user.token));
    expect(questions.status).toBe(200);
    expect(questions.body.data.questions).toHaveLength(3);

    const details = questions.body.data.questions.map((q: { wordId: string; word: string }) => ({
      wordId: q.wordId,
      word: q.word,
      givenAnswer: 'answer',
      correct: true,
      type: 'to_arabic',
    }));

    const submit = await request(app)
      .post('/api/english/quiz/submit')
      .set(auth(user.token))
      .send({ totalQuestions: 3, correctAnswers: 3, wrongAnswers: 0, details });
    expect(submit.status).toBe(201);
    expect(submit.body.data.attempt.scorePercent).toBe(100);

    const history = await request(app).get('/api/english/quiz/history').set(auth(user.token));
    expect(history.body.data.attempts).toHaveLength(1);
  });

  it('deletes a word', async () => {
    const user = await registerUser('Word Deleter');
    const created = await request(app).post('/api/english/words').set(auth(user.token)).send({ word: 'DeleteMe', meaning: 'احذفني' });
    const res = await request(app).delete(`/api/english/words/${created.body.data.word.id}`).set(auth(user.token));
    expect(res.status).toBe(200);
  });
});
