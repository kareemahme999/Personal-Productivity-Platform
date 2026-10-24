import request from 'supertest';
import { app, auth, registerUser } from './helpers';

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('creates an account and returns an access token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@test.local',
        password: 'Password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('john@test.local');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('rejects a duplicate email', async () => {
      const payload = { name: 'Jane', email: 'dupe@test.local', password: 'Password123' };
      await request(app).post('/api/auth/register').send(payload);
      const res = await request(app).post('/api/auth/register').send(payload);
      expect(res.status).toBe(409);
    });

    it('rejects weak passwords', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Weak',
        email: 'weak@test.local',
        password: 'short',
      });
      expect(res.status).toBe(400);
    });

    it('rejects invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Bad',
        email: 'not-an-email',
        password: 'Password123',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const user = await registerUser('Login User');
      const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('rejects wrong password', async () => {
      const user = await registerUser('Wrong Pass');
      const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'WrongPass123' });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'ghost@test.local', password: 'Password123' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user', async () => {
      const user = await registerUser('Me User');
      const res = await request(app).get('/api/auth/me').set(auth(user.token));
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(user.email);
    });

    it('rejects requests without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rotates refresh tokens and issues a new access token', async () => {
      const user = await registerUser('Refresh User');
      const login = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
      const cookie = login.headers['set-cookie'];
      const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(user.email);
    });

    it('rejects an invalid refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh').set('Cookie', 'aura_refresh=bogus');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logs out and revokes the refresh session', async () => {
      const user = await registerUser('Logout User');
      const login = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
      const cookie = login.headers['set-cookie'];
      const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
      expect(res.status).toBe(200);
      const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
      expect(refreshed.status).toBe(401);
    });
  });

  describe('Password reset flow', () => {
    it('forgot-password does not leak whether an email exists', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'does-not-exist@test.local' });
      expect(res.status).toBe(200);
    });

    it('resets the password using the token', async () => {
      const user = await registerUser('Reset User');
      const forgot = await request(app).post('/api/auth/forgot-password').send({ email: user.email });
      const devResetUrl = forgot.body.data?.devResetUrl;
      expect(devResetUrl).toBeDefined();
      const token = devResetUrl.split('token=')[1];

      const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'NewPassword456' });
      expect(res.status).toBe(200);

      const loginOld = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
      expect(loginOld.status).toBe(401);

      const loginNew = await request(app).post('/api/auth/login').send({ email: user.email, password: 'NewPassword456' });
      expect(loginNew.status).toBe(200);
    });

    it('rejects an invalid reset token', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({ token: 'bogus-token', password: 'NewPassword456' });
      expect(res.status).toBe(400);
    });
  });

  describe('Change password', () => {
    it('changes the password when current is correct', async () => {
      const user = await registerUser('Change Pass');
      const res = await request(app).post('/api/auth/change-password').set(auth(user.token)).send({
        currentPassword: user.password,
        newPassword: 'TotallyNew789',
      });
      expect(res.status).toBe(200);

      const loginNew = await request(app).post('/api/auth/login').send({ email: user.email, password: 'TotallyNew789' });
      expect(loginNew.status).toBe(200);
    });

    it('rejects a wrong current password', async () => {
      const user = await registerUser('Wrong Current');
      const res = await request(app).post('/api/auth/change-password').set(auth(user.token)).send({
        currentPassword: 'WrongCurrent1',
        newPassword: 'TotallyNew789',
      });
      expect(res.status).toBe(400);
    });
  });
});
