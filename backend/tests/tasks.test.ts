import request from 'supertest';
import { app, auth, registerUser } from './helpers';

describe('Tasks', () => {
  it('creates a task', async () => {
    const user = await registerUser('Task Creator');
    const res = await request(app)
      .post('/api/tasks')
      .set(auth(user.token))
      .send({ title: 'Write backend tests', description: 'Cover the API', priority: 'HIGH', dueDate: '2026-08-15' });
    expect(res.status).toBe(201);
    expect(res.body.data.task.title).toBe('Write backend tests');
    expect(res.body.data.task.status).toBe('PENDING');
  });

  it('creates a recurring task series with occurrences', async () => {
    const user = await registerUser('Recurring Creator');
    const res = await request(app)
      .post('/api/tasks')
      .set(auth(user.token))
      .send({ title: 'Study for 1 hour', recurrence: 'DAILY', recurrenceInterval: 1, dueDate: '2026-08-10', recurrenceEndDate: '2026-08-20' });
    expect(res.status).toBe(201);
    expect(res.body.data.occurrences.length).toBeGreaterThan(0);

    const list = await request(app).get('/api/tasks').set(auth(user.token));
    const seriesTasks = list.body.data.tasks.filter((t: { title: string }) => t.title === 'Study for 1 hour');
    expect(seriesTasks.length).toBeGreaterThan(0);
  });

  it('anchors recurring series to the due date when start date is missing', async () => {
    const user = await registerUser('Recurring Anchor');
    const res = await request(app)
      .post('/api/tasks')
      .set(auth(user.token))
      .send({ title: 'Follow-up review', recurrence: 'WEEKLY', recurrenceInterval: 1, dueDate: '2026-08-12', recurrenceEndDate: '2026-08-26' });

    expect(res.status).toBe(201);
    expect(res.body.data.occurrences).toHaveLength(3);
    expect(res.body.data.occurrences.map((o: { dueDate: string }) => o.dueDate.slice(0, 10))).toEqual([
      '2026-08-12',
      '2026-08-19',
      '2026-08-26',
    ]);
  });

  it('lists tasks with filters', async () => {
    const user = await registerUser('Task Lister');
    await request(app).post('/api/tasks').set(auth(user.token)).send({ title: 'Urgent task', priority: 'URGENT' });
    await request(app).post('/api/tasks').set(auth(user.token)).send({ title: 'Low task', priority: 'LOW' });

    const res = await request(app).get('/api/tasks?priority=URGENT').set(auth(user.token));
    expect(res.status).toBe(200);
    expect(res.body.data.tasks).toHaveLength(1);
    expect(res.body.data.tasks[0].title).toBe('Urgent task');
  });

  it('updates a task', async () => {
    const user = await registerUser('Task Updater');
    const created = await request(app).post('/api/tasks').set(auth(user.token)).send({ title: 'To update' });
    const id = created.body.data.task.id;

    const res = await request(app).put(`/api/tasks/${id}`).set(auth(user.token)).send({ title: 'Updated title', priority: 'URGENT' });
    expect(res.status).toBe(200);
    expect(res.body.data.task.title).toBe('Updated title');
    expect(res.body.data.task.priority).toBe('URGENT');
  });

  it('completes a task', async () => {
    const user = await registerUser('Task Completer');
    const created = await request(app).post('/api/tasks').set(auth(user.token)).send({ title: 'To complete' });
    const id = created.body.data.task.id;

    const res = await request(app).patch(`/api/tasks/${id}/complete`).set(auth(user.token)).send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('COMPLETED');
    expect(res.body.data.task.completedAt).toBeDefined();
  });

  it('deletes a task', async () => {
    const user = await registerUser('Task Deleter');
    const created = await request(app).post('/api/tasks').set(auth(user.token)).send({ title: 'To delete' });
    const id = created.body.data.task.id;

    const res = await request(app).delete(`/api/tasks/${id}`).set(auth(user.token));
    expect(res.status).toBe(200);

    const gone = await request(app).get(`/api/tasks/${id}`).set(auth(user.token));
    expect(gone.status).toBe(404);
  });

  it('validates task input', async () => {
    const user = await registerUser('Task Validator');
    const res = await request(app).post('/api/tasks').set(auth(user.token)).send({ title: '' });
    expect(res.status).toBe(400);
  });
});
