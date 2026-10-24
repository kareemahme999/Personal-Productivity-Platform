import request from 'supertest';
import { app, auth, registerUser } from './helpers';

describe('Authorization (data isolation)', () => {
  it('prevents a user from reading another user’s task', async () => {
    const owner = await registerUser('Owner A');
    const attacker = await registerUser('Attacker B');

    const created = await request(app).post('/api/tasks').set(auth(owner.token)).send({ title: 'Private task' });
    const id = created.body.data.task.id;

    const res = await request(app).get(`/api/tasks/${id}`).set(auth(attacker.token));
    expect(res.status).toBe(404);
  });

  it('prevents a user from updating another user’s task', async () => {
    const owner = await registerUser('Owner C');
    const attacker = await registerUser('Attacker D');

    const created = await request(app).post('/api/tasks').set(auth(owner.token)).send({ title: 'Secret' });
    const id = created.body.data.task.id;

    const res = await request(app).put(`/api/tasks/${id}`).set(auth(attacker.token)).send({ title: 'Hijacked' });
    expect(res.status).toBe(404);
  });

  it('prevents a user from deleting another user’s task', async () => {
    const owner = await registerUser('Owner E');
    const attacker = await registerUser('Attacker F');

    const created = await request(app).post('/api/tasks').set(auth(owner.token)).send({ title: 'Mine' });
    const id = created.body.data.task.id;

    const res = await request(app).delete(`/api/tasks/${id}`).set(auth(attacker.token));
    expect(res.status).toBe(404);

    const stillThere = await request(app).get(`/api/tasks/${id}`).set(auth(owner.token));
    expect(stillThere.status).toBe(200);
  });

  it('prevents a user from completing another user’s task', async () => {
    const owner = await registerUser('Owner G');
    const attacker = await registerUser('Attacker H');

    const created = await request(app).post('/api/tasks').set(auth(owner.token)).send({ title: 'Do not touch' });
    const id = created.body.data.task.id;

    const res = await request(app).patch(`/api/tasks/${id}/complete`).set(auth(attacker.token)).send({ completed: true });
    expect(res.status).toBe(404);
  });

  it('isolates words between users', async () => {
    const alice = await registerUser('Alice');
    const bob = await registerUser('Bob');

    await request(app).post('/api/english/words').set(auth(alice.token)).send({ word: 'AliceOnly', meaning: 'خاصة' });

    const bobsWords = await request(app).get('/api/english/words').set(auth(bob.token));
    expect(bobsWords.body.data.words).toHaveLength(0);
  });

  it('isolates categories and resources between users', async () => {
    const alice = await registerUser('Cat Alice');
    const bob = await registerUser('Cat Bob');

    const cat = await request(app).post('/api/categories').set(auth(alice.token)).send({ name: 'Alice Private' });
    const catId = cat.body.data.category.id;

    const list = await request(app).get('/api/categories').set(auth(bob.token));
    expect(list.body.data.categories).toHaveLength(0);

    await request(app)
      .post('/api/resources')
      .set(auth(alice.token))
      .send({ title: 'Alice resource', url: 'https://alice.example.com' });

    const bobResources = await request(app).get('/api/resources').set(auth(bob.token));
    expect(bobResources.body.data.resources).toHaveLength(0);
    expect(catId).toBeDefined();
  });

  it('returns empty statistics for a fresh user (no fake data)', async () => {
    const user = await registerUser('Stats Fresh');
    const res = await request(app).get('/api/statistics/dashboard').set(auth(user.token));
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.total).toBe(0);
    expect(res.body.data.tasks.completionRate).toBe(0);
    expect(res.body.data.vocabulary.total).toBe(0);
  });

  it('requires authentication on all protected endpoints', async () => {
    const endpoints = [
      ['get', '/api/tasks'],
      ['post', '/api/tasks'],
      ['get', '/api/categories'],
      ['get', '/api/resources'],
      ['get', '/api/english/words'],
      ['get', '/api/goals'],
      ['get', '/api/statistics/dashboard'],
      ['get', '/api/search?q=hello'],
      ['get', '/api/notifications'],
      ['get', '/api/backup/export'],
    ] as const;

    for (const [method, url] of endpoints) {
      const res = await request(app)[method](url);
      expect(res.status).toBe(401);
    }
  });
});
