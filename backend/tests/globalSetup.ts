import { execSync } from 'node:child_process';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:AuraDev!Postgres2026@localhost:5432/aura_test';

export default function globalSetup(): void {
  execSync('npx prisma db push --force-reset --accept-data-loss --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
    cwd: __dirname + '/..',
  });
}
