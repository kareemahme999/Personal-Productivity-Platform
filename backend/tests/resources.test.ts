import request from 'supertest';
import { app, auth, registerUser } from './helpers';

describe('Resources', () => {
  it('creates a link resource', async () => {
    const user = await registerUser('Resource Creator');
    const res = await request(app)
      .post('/api/resources')
      .set(auth(user.token))
      .send({ title: 'Useful docs', url: 'https://docs.example.com', type: 'LINK' });
    expect(res.status).toBe(201);
    expect(res.body.data.resource.type).toBe('LINK');
  });

  it('requires a URL for link resources', async () => {
    const user = await registerUser('Resource No URL');
    const res = await request(app)
      .post('/api/resources')
      .set(auth(user.token))
      .send({ title: 'Missing url', type: 'LINK' });
    expect(res.status).toBe(400);
  });

  it('lists resources with search', async () => {
    const user = await registerUser('Resource Lister');
    await request(app).post('/api/resources').set(auth(user.token)).send({ title: 'React guide', url: 'https://react.dev' });
    await request(app).post('/api/resources').set(auth(user.token)).send({ title: 'Vue guide', url: 'https://vuejs.org' });

    const res = await request(app).get('/api/resources?q=react').set(auth(user.token));
    expect(res.status).toBe(200);
    expect(res.body.data.resources).toHaveLength(1);
    expect(res.body.data.resources[0].title).toBe('React guide');
  });

  it('updates and deletes a resource', async () => {
    const user = await registerUser('Resource Updater');
    const created = await request(app).post('/api/resources').set(auth(user.token)).send({ title: 'Old title', url: 'https://a.example.com' });
    const id = created.body.data.resource.id;

    const updated = await request(app).put(`/api/resources/${id}`).set(auth(user.token)).send({ title: 'New title' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.resource.title).toBe('New title');

    const del = await request(app).delete(`/api/resources/${id}`).set(auth(user.token));
    expect(del.status).toBe(200);
  });

  it('uploads a file resource', async () => {
    const user = await registerUser('Resource Uploader');
    const res = await request(app)
      .post('/api/resources')
      .set(auth(user.token))
      .field('title', 'My notes file')
      .attach('file', Buffer.from('hello world'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(201);
    expect(res.body.data.resource.type).toBe('FILE');
    expect(res.body.data.resource.fileName).toBe('notes.txt');
  });

  it('rejects active-content file types such as SVG and HTML', async () => {
    const user = await registerUser('Resource Bad File');

    const svg = await request(app)
      .post('/api/resources')
      .set(auth(user.token))
      .field('title', 'Bad SVG')
      .attach('file', Buffer.from('<svg><script>alert(1)</script></svg>'), { filename: 'payload.svg', contentType: 'image/svg+xml' });
    expect(svg.status).toBe(400);

    const html = await request(app)
      .post('/api/resources')
      .set(auth(user.token))
      .field('title', 'Bad HTML')
      .attach('file', Buffer.from('<html><body>hi</body></html>'), { filename: 'payload.html', contentType: 'text/html' });
    expect(html.status).toBe(400);
  });
});
