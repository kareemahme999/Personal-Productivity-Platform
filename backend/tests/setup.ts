// Runs before the test suite loads. Sets a dedicated test database and valid
// secrets so the app boots in isolation from development data.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:AuraDev!Postgres2026@localhost:5432/aura_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-at-least-16-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-16-chars';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.API_URL = 'http://localhost:5000';
process.env.UPLOAD_DIR = 'uploads';
process.env.CORS_ORIGIN = 'http://localhost:5173';
