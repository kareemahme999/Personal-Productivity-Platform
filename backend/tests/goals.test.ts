import request from 'supertest';
import { app, auth, registerUser } from './helpers';

describe('Goals', () => {
  it('creates a goal with progress', async () => {
    const user = await registerUser('Goal Creator');
    const res = await request(app)
      .post('/api/goals')
      .set(auth(user.token))
      .send({ title: 'Complete ML Course', description: 'Finish the capstone', progress: 35, deadline: '2026-12-31' });
    expect(res.status).toBe(201);
    expect(res.body.data.goal.title).toBe('Complete ML Course');
    expect(res.body.data.goal.progress).toBe(35);
  });

  it('rejects progress out of range', async () => {
    const user = await registerUser('Goal Range');
    const res = await request(app).post('/api/goals').set(auth(user.token)).send({ title: 'Bad progress', progress: 150 });
    expect(res.status).toBe(400);
  });

  it('updates goal progress to complete it', async () => {
    const user = await registerUser('Goal Updater');
    const created = await request(app).post('/api/goals').set(auth(user.token)).send({ title: 'Run 5km', progress: 20 });
    const id = created.body.data.goal.id;

    const res = await request(app).put(`/api/goals/${id}`).set(auth(user.token)).send({ progress: 100 });
    expect(res.status).toBe(200);
    expect(res.body.data.goal.progress).toBe(100);
    expect(res.body.data.goal.status).toBe('COMPLETED');
    expect(res.body.data.goal.completedAt).toBeDefined();
  });

  it('lists and searches goals', async () => {
    const user = await registerUser('Goal Lister');
    await request(app).post('/api/goals').set(auth(user.token)).send({ title: 'Learn Spanish' });
    await request(app).post('/api/goals').set(auth(user.token)).send({ title: 'Learn Arabic' });

    const res = await request(app).get('/api/goals?q=spanish').set(auth(user.token));
    expect(res.body.data.goals).toHaveLength(1);
    expect(res.body.data.goals[0].title).toBe('Learn Spanish');
  });

  it('deletes a goal', async () => {
    const user = await registerUser('Goal Deleter');
    const created = await request(app).post('/api/goals').set(auth(user.token)).send({ title: 'Temp goal' });
    const res = await request(app).delete(`/api/goals/${created.body.data.goal.id}`).set(auth(user.token));
    expect(res.status).toBe(200);
  });
});
