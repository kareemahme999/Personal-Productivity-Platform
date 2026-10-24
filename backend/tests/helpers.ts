import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

export interface TestUser {
  email: string;
  password: string;
  name: string;
  token: string;
  userId: string;
}

let counter = 0;

export async function registerUser(name?: string): Promise<TestUser> {
  counter += 1;
  const email = `user${Date.now()}_${counter}@test.local`;
  const password = 'Password123';
  const res = await request(app).post('/api/auth/register').send({ name: name ?? 'Test User', email, password });
  if (res.status !== 201) {
    throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  }
  return {
    email,
    password,
    name: name ?? 'Test User',
    token: res.body.data.accessToken,
    userId: res.body.data.user.id,
  };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export { app };
