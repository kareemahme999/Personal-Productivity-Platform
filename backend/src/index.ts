import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app';
import { env } from './config/env';

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
for (const sub of ['profiles', 'files', 'tasks']) {
  fs.mkdirSync(path.join(uploadRoot, sub), { recursive: true });
}

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Aura API running at ${env.API_URL} (${env.NODE_ENV})`);
});
