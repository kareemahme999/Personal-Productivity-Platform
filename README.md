<div align="center">

# ✨ Aura

### Your personal productivity and learning workspace

Tasks · Recurring schedules · Calendar · Resources · English vocabulary · Quizzes · Goals · Statistics · Backup

<br/>

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Jest](https://img.shields.io/badge/Tested_with-Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

<br/>

[**Features**](#-features) ·
[**Quick start**](#-quick-start) ·
[**Architecture**](#-application-architecture) ·
[**API**](#-api-reference) ·
[**Deployment**](#-deployment)

</div>

---

## 🧭 App at a glance

```mermaid
flowchart LR
    Login([🔐 Sign in]) --> Dash["📊 Dashboard"]
    Dash --> Tasks["✅ Tasks"]
    Dash --> Cal["🗓️ Calendar"]
    Dash --> Res["📚 Resources"]
    Dash --> Vocab["🇬🇧 Vocabulary"]
    Dash --> Goals["🎯 Goals"]
    Dash --> Stats["📈 Statistics"]
    Dash --> Search["🔎 Search"]
    Dash --> Profile["👤 Profile and theme"]
    Tasks --> Rec["🔁 Recurring series"]
    Tasks --> Att["📎 Attachments"]
    Vocab --> Quiz["🧠 Quizzes"]
    Quiz --> Hist["🕘 Quiz history"]
```

<!--
  Optional: add real screenshots later. Put the images in docs/screenshots/
  and then uncomment the block below (only after the files exist, otherwise
  GitHub shows "image not found").

  | Dashboard | Tasks and Calendar |
  | :---: | :---: |
  | ![Dashboard](docs/screenshots/dashboard.png) | ![Tasks](docs/screenshots/tasks-calendar.png) |
-->

---

## 📑 Contents

<details open>
<summary><b>Jump to a section</b></summary>

- [Features](#-features)
- [Technology stack](#️-technology-stack)
- [Application architecture](#️-application-architecture)
- [Project structure](#-project-structure)
- [Prerequisites](#️-prerequisites)
- [Quick start](#-quick-start)
- [Environment variables](#-environment-variables)
- [Application workflows](#️-application-workflows)
- [API reference](#-api-reference)
- [Testing and quality assurance](#-testing-and-quality-assurance)
- [Security](#-security)
- [Deployment](#-deployment)
- [Troubleshooting](#️-troubleshooting)
- [Roadmap](#️-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

</details>

---

## ✨ Features

### Feature map

```mermaid
mindmap
  root((Aura))
    Accounts
      Register and sign in
      Token refresh
      Password change and reset
      Profile and avatar
      Light and dark theme
    Productivity
      Tasks
        Priority and status
        Categories
        Notes and links
        Attachments
      Recurring tasks
        Daily weekly monthly yearly
        Optional end date
      Calendar
      Goals
        Progress tracking
    Learning
      English vocabulary
        Favorites and learned
        Word of the day
      Quizzes
        History
    Knowledge
      Resources
        Links notes files
      Global search
    Insights
      Dashboard
      Statistics
      Reminders
    Data
      JSON backup and restore
      CSV export
```

### What Aura provides

| Area | Capabilities |
| :-- | :-- |
| 🔐 **Accounts and profile** | Registration, sign-in/out, access-token refresh, password change/reset, profile details, avatar upload, and light/dark theme preference. |
| ✅ **Tasks** | Create, filter, search, update, complete, and delete tasks; manage priority, status, categories, dates, times, notes, links, and attachments. |
| 🔁 **Recurring tasks** | Daily, weekly, monthly, and yearly schedules with an interval and optional end date. Occurrences are materialized up to a three-month horizon, capped at 60; completing an occurrence can extend the series. |
| 🗓️ **Calendar** | Month calendar showing task schedules, with task creation for a selected day. |
| 📚 **Resources** | Save links, notes, and uploaded files, optionally organized by category. Upload types and sizes are restricted by the backend. |
| 🇬🇧 **English vocabulary** | Personal words with meanings, examples, pronunciation, categories, favorites, and learned status, plus a word of the day. |
| 🧠 **Quizzes** | Generate vocabulary questions by learning status or favorites, submit answers, and review quiz history. |
| 🎯 **Goals** | Create and update goals, track progress from 0–100%, and manage active, completed, and archived statuses. |
| 📊 **Statistics** | Dashboard, task, productivity, and vocabulary statistics, including chart-ready summaries and quiz history. |
| 🔎 **Search and reminders** | Search across personal content; review overdue, due-today, due-tomorrow, and upcoming task reminders. |
| 📦 **Backup** | Export records as JSON, or selected tables as CSV; restore supported JSON records with duplicate checks for categories and vocabulary words. JSON exports do **not** include uploaded file contents or task attachment rows. |

### Task lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> PENDING: create
    PENDING --> IN_PROGRESS: start
    IN_PROGRESS --> COMPLETED: complete
    PENDING --> COMPLETED: complete
    COMPLETED --> PENDING: reopen
    COMPLETED --> [*]: delete
```

> [!NOTE]
> These capabilities are documented from the routes, pages, and services in the
> repository. A feature list is not a claim of complete automated or end-to-end
> test coverage.

---

## 🛠️ Technology stack

```mermaid
flowchart TB
    subgraph FE["🖥️ Frontend"]
        direction LR
        F1[React 18] --- F2[TypeScript] --- F3[Vite 6] --- F4[Tailwind CSS 3]
        F5[React Router 6] --- F6[TanStack Query] --- F7[Axios] --- F8[Recharts]
    end
    subgraph BE["⚙️ Backend"]
        direction LR
        B1[Node.js 20+] --- B2[Express 4] --- B3[TypeScript] --- B4[Zod]
    end
    subgraph DATA["🗄️ Data"]
        direction LR
        D1[(PostgreSQL 16+)] --- D2[Prisma ORM 6]
    end
    FE --> BE --> DATA
```

| Layer | Technologies |
| :-- | :-- |
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS 3, React Router 6, TanStack Query, Axios, Recharts, Lucide React |
| **Backend** | Node.js 20+, Express 4, TypeScript, Zod validation |
| **Database / ORM** | PostgreSQL 16+, Prisma ORM and Prisma Client 6 |
| **Auth and security** | JWT access tokens, rotating opaque refresh tokens stored as hashes, `httpOnly` refresh cookie, bcryptjs, Helmet, CORS allowlist, express-rate-limit, Multer upload restrictions |
| **Testing and tooling** | Jest, ts-jest, Supertest, TypeScript, tsx, GitHub Actions |
| **Optional email** | Nodemailer with an SMTP server for password-reset delivery |

---

## 🏗️ Application architecture

```mermaid
flowchart LR
    Person([👤 User])
    Browser["React SPA<br/>Vite + TypeScript"]
    API["Express API<br/>REST + Zod"]
    Auth["Auth middleware<br/>JWT access token"]
    Services["Feature services<br/>Auth · Tasks · Resources<br/>Goals · Vocabulary · Backup"]
    Prisma[Prisma Client]
    DB[("PostgreSQL")]
    Mail["SMTP server<br/>(optional)"]
    Files[("Local upload<br/>directory")]

    Person --> Browser
    Browser -->|"JSON API / multipart uploads"| API
    API --> Auth
    Auth --> Services
    API --> Services
    Services --> Prisma
    Prisma --> DB
    Services --> Files
    Services -. "password-reset email" .-> Mail
```

The frontend calls the backend under `/api`. During local development, Vite
proxies `/api` and `/uploads` to the backend on port `5000`. In a deployed
frontend, `VITE_API_URL` can point the SPA to the API origin.

Protected feature routers require a bearer access token. Authentication
endpoints issue a short-lived access token and a rotating refresh token in an
`httpOnly` cookie. The backend scopes application records to the authenticated
user and persists them through Prisma to PostgreSQL. Uploaded assets are stored
in the configured upload directory and served from the `/uploads` path.

### Conceptual data model

> [!NOTE]
> This diagram is a simplified, high-level view of how Aura's entities relate.
> The source of truth is [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma);
> update this diagram if the schema changes.

```mermaid
erDiagram
    USER ||--o{ TASK : owns
    USER ||--o{ CATEGORY : owns
    USER ||--o{ RESOURCE : owns
    USER ||--o{ WORD : owns
    USER ||--o{ GOAL : owns
    USER ||--o{ QUIZ_ATTEMPT : takes
    USER ||--o{ REFRESH_TOKEN : holds
    CATEGORY |o--o{ TASK : groups
    CATEGORY |o--o{ RESOURCE : groups
    TASK ||--o{ TASK_ATTACHMENT : has
    TASK |o--o{ TASK : "recurring series"
```

---

## 📂 Project structure

```text
.
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Backend tests/typecheck and frontend checks
│       └── pages.yml              # Frontend GitHub Pages deployment
├── backend/
│   ├── prisma/
│   │   ├── migrations/            # Versioned PostgreSQL schema migrations
│   │   ├── schema.prisma          # Database models and relations
│   │   └── seed.ts                # Optional demo data seed
│   ├── src/
│   │   ├── config/                # Environment validation
│   │   ├── lib/                   # Prisma client
│   │   ├── middlewares/           # Auth, validation, uploads, errors, limits
│   │   ├── modules/               # Feature routes, controllers, services
│   │   ├── utils/                 # Shared helpers
│   │   ├── app.ts                 # Express app and route registration
│   │   └── index.ts               # API process entry point
│   ├── tests/                     # Jest/Supertest backend tests
│   ├── .env.example               # Backend environment template
│   ├── Dockerfile                 # Backend container build
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                   # API client and request helpers
│   │   ├── auth/                  # Client authentication state
│   │   ├── components/            # Shared UI, layout, and feature components
│   │   ├── pages/                 # SPA routes and screens
│   │   └── App.tsx                # Browser routes and providers
│   ├── .env.example               # Optional frontend environment template
│   ├── vite.config.ts             # Vite, aliases, and local API proxies
│   └── package.json
├── scripts/
│   ├── start-db.ps1               # Start the documented local PostgreSQL cluster
│   └── stop-db.ps1                # Stop that local cluster
├── render.yaml                    # Render API/database deployment blueprint
└── README.md
```

---

## ⚙️ Prerequisites

| Requirement | Version / note |
| :-- | :-- |
| **Node.js** and npm | 20 or later (CI currently uses Node.js 22) |
| **PostgreSQL** | 16 or later, reachable by the backend |
| **Git** | To clone the repository |
| **Terminal** | With access to the project directory |

For local Windows PostgreSQL start/stop helper scripts, see
[`scripts/`](./scripts/). They expect a locally installed PostgreSQL instance
and its data directory to be configured for the machine; inspect them before
use and never point them at production data.

---

## 🚀 Quick start

```mermaid
flowchart LR
    A["1 · Clone"] --> B["2 · Create<br/>database"] --> C["3 · Configure<br/>backend"] --> D["4 · Migrate<br/>and seed"] --> E["5 · Install<br/>frontend"] --> F["6 · Run"]
```

### 1. Get the source

```bash
git clone <repository-url> aura
cd aura
```

This project has separate `backend/` and `frontend/` npm projects; there is no
root `package.json`.

### 2. Configure PostgreSQL

Create a dedicated **local development** database and role (never a production
one). After connecting as an administrator, with your own secure password:

```sql
CREATE ROLE aura_app LOGIN PASSWORD '<choose-a-local-password>';
CREATE DATABASE aura OWNER aura_app;
```

If you prefer to administer grants separately, give the application role access
to the database and schema. Keep credentials local and never commit them.

### 3. Install and configure the backend

```bash
cd backend
npm ci
```

Copy the environment template and replace the example values:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell (run instead of the command above)
Copy-Item .env.example .env
```

At minimum, set `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.
Generate independent, high-entropy secrets for both JWT keys; the values in
`.env.example` are placeholders and must not be used in production.

### 4. Migrate (and optionally seed) the database

```bash
npx prisma generate
npm run db:migrate
```

`db:migrate` runs `prisma migrate deploy`, which applies pending migrations and
does not reset the database.

For optional demo data in a **development** database:

```bash
npm run db:seed
```

> [!CAUTION]
> The seed creates or updates demo content in the database selected by
> `DATABASE_URL`. Do not run it against production.

### 5. Install the frontend

In a second terminal at the repository root:

```bash
cd frontend
npm ci
```

For local development no frontend environment file is required. Vite proxies
the same-origin `/api` and `/uploads` paths to `http://localhost:5000`.

### 6. Run the application

| Terminal | Commands |
| :-- | :-- |
| **Backend** | `cd backend` → `npm run dev` |
| **Frontend** | `cd frontend` → `npm run dev` |

| Service | URL |
| :-- | :-- |
| 🌐 App | <http://localhost:5173/> |
| 💚 API health | <http://localhost:5000/api/health> |

> [!TIP]
> On Windows, if PowerShell blocks `npm.ps1` due to execution policy, use
> `npm.cmd` in place of `npm`, or a terminal whose policy permits the npm
> shim. Don't change machine-wide policy solely for this project.

---

## 🔐 Environment variables

### Backend

The backend validates environment values at startup in
[`backend/src/config/env.ts`](./backend/src/config/env.ts). Only
`DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` are required;
everything else has a code-defined default.

| Variable | Required | Purpose | Safe example / default |
| :-- | :-: | :-- | :-- |
| `NODE_ENV` | No | Runtime mode | `development` |
| `PORT` | No | Express listening port | `5000` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://aura_app:<password>@localhost:5432/aura?schema=public` |
| `JWT_ACCESS_SECRET` | **Yes** | Signs access JWTs; minimum 16 characters | `<generate-a-long-random-secret>` |
| `JWT_REFRESH_SECRET` | **Yes** | Key used by token/reset hashing utilities; minimum 16 characters | `<generate-a-different-long-random-secret>` |
| `JWT_ACCESS_EXPIRES_IN` | No | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh-token lifetime | `30d` |
| `CLIENT_URL` | No | Frontend origin used to build reset links | `http://localhost:5173` |
| `API_URL` | No | API URL printed at startup | `http://localhost:5000` |
| `CORS_ORIGIN` | No | Comma-separated allowed browser origins | `http://localhost:5173` |
| `SMTP_HOST` | No | SMTP hostname; blank disables SMTP delivery | *(blank)* |
| `SMTP_PORT` | No | SMTP port | `587` |
| `SMTP_SECURE` | No | SMTP TLS mode | `false` |
| `SMTP_USER` | No | SMTP username | *(blank)* |
| `SMTP_PASS` | No | SMTP password | *(blank)* |
| `MAIL_FROM` | No | Sender address for reset email | `Aura <noreply@example.com>` |
| `UPLOAD_DIR` | No | Local upload root | `uploads` |
| `MAX_FILE_SIZE_MB` | No | Maximum upload size in MiB | `10` |
| `RATE_LIMIT_WINDOW_MS` | No | General API rate-limit window | `900000` |
| `RATE_LIMIT_MAX` | No | General requests allowed per window | `200` |

`DATABASE_URL` must be a valid PostgreSQL URL. URL-encode special characters in
database usernames or passwords. The required variables must also be set in
production; never use the sample secrets from `.env.example`.

> [!IMPORTANT]
> When SMTP is not configured, password-reset requests stay generic so they
> don't reveal whether an email exists. In non-production mode the API can
> return a development reset URL for local testing, and the development mail
> helper logs message content (including reset links) to the backend console.
> Keep those logs private and never rely on this behavior in production.

### Frontend

| Variable | Required | Purpose | Example |
| :-- | :-: | :-- | :-- |
| `VITE_API_URL` | No | API origin for a separately hosted backend; blank uses same-origin `/api` | `https://api.example.com` |
| `VITE_BASE_PATH` | No | Vite base path for hosting under a subdirectory | `/my-repository/` |

> [!WARNING]
> `VITE_*` values are embedded in the browser bundle and are **not secrets**.
> Never place passwords, private keys, or tokens in frontend environment
> variables.

---

## 🗺️ Application workflows

### Authentication and protected requests

```mermaid
sequenceDiagram
    actor User
    participant SPA as React frontend
    participant API as Express API
    participant DB as PostgreSQL

    User->>SPA: Submit email and password
    SPA->>API: POST /api/auth/login
    API->>DB: Find user and verify password hash
    DB-->>API: User record
    API-->>SPA: Access token + httpOnly refresh cookie
    SPA->>API: Protected request with Bearer access token
    API->>DB: Load authenticated user
    API-->>SPA: User-scoped response
    SPA->>API: POST /api/auth/refresh (when needed)
    API->>DB: Revoke old refresh token and persist rotated token hash
    API-->>SPA: New access token + rotated refresh cookie
```

### Password reset

```mermaid
sequenceDiagram
    actor User
    participant SPA as React frontend
    participant API as Express API
    participant Mail as SMTP (optional)

    User->>SPA: Request password reset
    SPA->>API: POST /api/auth/forgot-password
    API-->>SPA: Generic response (never reveals if email exists)
    API-->>Mail: Send reset link (when SMTP is configured)
    User->>SPA: Open link and choose new password
    SPA->>API: POST /api/auth/reset-password (token, password)
    API-->>SPA: Password updated
```

### Recurring task materialization

```mermaid
flowchart TD
    Create[Create recurring template]
    Template[("Template task<br/>seriesId is null")]
    Horizon["Choose schedule horizon<br/>and optional end date"]
    Generate["Generate occurrences<br/>up to 60 per series"]
    Rows[("Occurrence task rows<br/>linked by seriesId")]
    Complete[Complete an occurrence]
    Extend["Generate later occurrences<br/>when needed"]

    Create --> Template
    Template --> Horizon
    Horizon --> Generate
    Generate --> Rows
    Rows --> Complete
    Complete --> Extend
    Extend --> Rows
```

### Backup and restore

```mermaid
flowchart LR
    U([User]) --> Export["GET /api/backup/export"]
    U --> CSV["GET /api/backup/export/:table/csv"]
    Export --> JSON[("JSON backup")]
    CSV --> Table[("CSV file")]
    JSON --> Restore["POST /api/backup/restore"]
    Restore --> Check{"Duplicate check<br/>categories and words"}
    Check --> DB[("PostgreSQL")]
    JSON -. "does not include" .-> X["Uploaded file contents<br/>Task attachment rows"]
```

---

## 🔌 API reference

All endpoints are prefixed with `/api`. Except for the health endpoint and
public authentication actions, routes require:

```http
Authorization: Bearer <access-token>
```

Authentication responses also set the `aura_refresh` refresh token as an
`httpOnly` cookie. Successful responses generally use
`{ "success": true, "data": ... }`; errors use
`{ "success": false, "error": { "code": "...", "message": "..." } }`.

```mermaid
flowchart LR
    API["/api"] --> H[health]
    API --> A[auth]
    API --> T[tasks]
    API --> C[categories]
    API --> R[resources]
    API --> E["english<br/>words · quiz"]
    API --> G[goals]
    API --> S[statistics]
    API --> Q[search]
    API --> N[notifications]
    API --> B[backup]
```

<details open>
<summary><b>💚 Health</b></summary>

| Method | Endpoint | Purpose | Auth |
| :-: | :-- | :-- | :-: |
| `GET` | `/api/health` | Reports API status and process uptime. | No |

</details>

<details>
<summary><b>🔐 Authentication</b></summary>

| Method | Endpoint | Purpose | Auth |
| :-: | :-- | :-- | :-: |
| `POST` | `/api/auth/register` | Create an account; body: `name`, `email`, `password`. | No |
| `POST` | `/api/auth/login` | Sign in; body: `email`, `password`. | No |
| `POST` | `/api/auth/logout` | Revoke the refresh session and clear its cookie. | No |
| `POST` | `/api/auth/refresh` | Rotate the refresh cookie and issue a new access token. | Refresh cookie |
| `POST` | `/api/auth/forgot-password` | Request a password-reset link; body: `email`. | No |
| `POST` | `/api/auth/reset-password` | Set a new password; body: `token`, `password`. | No |
| `GET` | `/api/auth/me` | Return the authenticated user's safe profile. | Yes |
| `POST` | `/api/auth/change-password` | Change password; body: `currentPassword`, `newPassword`. | Yes |
| `PATCH` | `/api/auth/profile` | Update profile name/theme; may include multipart `profileImage`. | Yes |

</details>

<details>
<summary><b>✅ Tasks and categories</b></summary>

| Method | Endpoint | Purpose | Auth |
| :-: | :-- | :-- | :-: |
| `GET` | `/api/tasks` | List/filter tasks. Query: `status`, `priority`, `categoryId`, `q`, `dueFrom`, `dueTo`, `completed`, `page`, `limit`. | Yes |
| `POST` | `/api/tasks` | Create a task or recurring template. | Yes |
| `GET` | `/api/tasks/:id` | Read a task; recurring templates include their occurrences. | Yes |
| `PUT` | `/api/tasks/:id` | Update a task; recurring updates accept `applyTo: "this" \| "series"`. | Yes |
| `PATCH` | `/api/tasks/:id/complete` | Complete or reopen a task; body may set `completed` to a boolean. | Yes |
| `DELETE` | `/api/tasks/:id` | Delete a task; recurring occurrences may use query `mode=series`. | Yes |
| `POST` | `/api/tasks/:id/attachments` | Upload one attachment as multipart field `file`. | Yes |
| `DELETE` | `/api/tasks/:id/attachments/:attachmentId` | Remove a task attachment. | Yes |
| `GET` | `/api/categories` | List the authenticated user's categories. | Yes |
| `POST` | `/api/categories` | Create a category. | Yes |
| `PUT` | `/api/categories/:id` | Update a category. | Yes |
| `DELETE` | `/api/categories/:id` | Delete a category. | Yes |

**Enumerations**

| Field | Values |
| :-- | :-- |
| Status | `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| Priority | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| Recurrence | `NONE`, `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY` |

**Example request**

```http
POST /api/tasks
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "title": "Review project notes",
  "priority": "MEDIUM",
  "status": "PENDING",
  "dueDate": "2026-11-15",
  "recurrence": "NONE"
}
```

</details>

<details>
<summary><b>📚 Resources</b></summary>

| Method | Endpoint | Purpose | Auth |
| :-: | :-- | :-- | :-: |
| `GET` | `/api/resources` | List resources; query: `type`, `categoryId`, `q`, `page`, `limit`. | Yes |
| `POST` | `/api/resources` | Create a link/note or upload a file; file field is `file`. | Yes |
| `PUT` | `/api/resources/:id` | Update resource details or replace its uploaded file. | Yes |
| `DELETE` | `/api/resources/:id` | Delete a resource and attempt to remove its stored file. | Yes |

</details>

<details>
<summary><b>🇬🇧 English vocabulary and quizzes</b></summary>

| Method | Endpoint | Purpose | Auth |
| :-: | :-- | :-- | :-: |
| `GET` | `/api/english/words` | List/search/filter words. Query: `q`, `category`, `favorite`, `learned`, `page`, `limit`. | Yes |
| `GET` | `/api/english/words/categories` | List vocabulary categories. | Yes |
| `GET` | `/api/english/words/word-of-day` | Retrieve the word-of-day result. | Yes |
| `POST` | `/api/english/words` | Create a word. | Yes |
| `PUT` | `/api/english/words/:id` | Update a word. | Yes |
| `PATCH` | `/api/english/words/:id/learned` | Update learned/favorite flags. | Yes |
| `DELETE` | `/api/english/words/:id` | Delete a word. | Yes |
| `GET` | `/api/english/quiz/questions` | Generate questions; query: `count`, `mode`. | Yes |
| `POST` | `/api/english/quiz/submit` | Submit quiz totals and answer details. | Yes |
| `GET` | `/api/english/quiz/history` | Retrieve quiz history. | Yes |

</details>

<details>
<summary><b>🎯 Goals, statistics, search, notifications, and backup</b></summary>

| Method | Endpoint | Purpose | Auth |
| :-: | :-- | :-- | :-: |
| `GET` | `/api/goals` | List goals; query: `status`, `q`, `page`, `limit`. | Yes |
| `POST` | `/api/goals` | Create a goal. | Yes |
| `PUT` | `/api/goals/:id` | Update a goal. | Yes |
| `DELETE` | `/api/goals/:id` | Delete a goal. | Yes |
| `GET` | `/api/statistics/dashboard` | Dashboard summaries. | Yes |
| `GET` | `/api/statistics/tasks` | Task statistics. | Yes |
| `GET` | `/api/statistics/productivity` | Productivity summaries. | Yes |
| `GET` | `/api/statistics/vocabulary` | Vocabulary and quiz statistics. | Yes |
| `GET` | `/api/search` | Search personal content; accepts `q`, optional `types`, `limit`. | Yes |
| `GET` | `/api/notifications` | Return task reminders. | Yes |
| `GET` | `/api/backup/export` | Export JSON backup for the current user. | Yes |
| `GET` | `/api/backup/export/:table/csv` | Export `tasks`, `categories`, `resources`, `words`, or `goals` as CSV. | Yes |
| `POST` | `/api/backup/restore` | Restore supported records from a JSON backup body. | Yes |

</details>

---

## 🧪 Testing and quality assurance

Run backend checks from `backend/`:

```bash
npm run typecheck
npm test
```

> [!CAUTION]
> The backend test suite's global setup **force-resets the test database**
> before running. The checked-in setup targets a database named `aura_test`.
> Confirm it is disposable before running `npm test`. The runtime setup also
> sets `DATABASE_URL` to `aura_test`, so changing only `TEST_DATABASE_URL` can
> make setup and runtime point at different databases. Never point either URL at
> development or production data.

Run frontend checks from `frontend/`:

```bash
npm run typecheck
npm run build
```

The frontend build runs TypeScript checking before creating `frontend/dist`.
There is currently no frontend test script and no lint script/configuration.

```mermaid
flowchart LR
    Push([Push / Pull request]) --> CI[GitHub Actions: ci.yml]
    CI --> BT["Backend<br/>typecheck + tests"]
    CI --> FT["Frontend<br/>typecheck + build"]
    BT --> Result{All green?}
    FT --> Result
    Result -->|Yes| OK[✅ Checks pass]
    Result -->|No| Fail[❌ Fix and push again]
```

CI runs backend type checking and tests, plus frontend type checking and a
production build. This does not constitute full browser end-to-end coverage.

---

## 🔒 Security

```mermaid
flowchart LR
    Req([Request]) --> RL[Rate limiting]
    RL --> CORS[CORS allowlist]
    CORS --> H[Helmet headers]
    H --> JWT[JWT verification]
    JWT --> Z[Zod validation]
    Z --> Own[Per-user record scoping]
    Own --> DB[(PostgreSQL)]
```

- Protected routes validate bearer access tokens and use the authenticated user
  ID for user-owned records.
- Passwords are hashed with bcryptjs. Refresh tokens are opaque, rotated, and
  stored as hashes; the raw token is sent only in an `httpOnly` cookie.
- Zod schemas validate request bodies and selected query parameters.
- Helmet provides security headers; CORS uses an origin allowlist; rate limiters
  apply to API and authentication requests.
- Uploads have a size limit and a MIME-type allowlist; active content such as
  HTML and SVG is rejected.
- Keep `.env` files and production secrets out of source control. Use distinct,
  high-entropy JWT secrets and a least-privilege database role.
- Use HTTPS in production; cross-site refresh cookies require secure transport.
- Use durable storage for uploads if your host's filesystem is ephemeral. The
  repository uses local disk uploads; no cloud object-storage integration is
  configured.

> [!WARNING]
> Security controls reduce risk but do not guarantee that an application is
> secure. Review deployment networking, database backups, secret rotation,
> monitoring, and upload storage before exposing a production service.

---

## 🚢 Deployment

The repository includes a Render blueprint ([`render.yaml`](./render.yaml)), a
backend [`Dockerfile`](./backend/Dockerfile), and a GitHub Actions workflow
that deploys the **frontend** to GitHub Pages.

```mermaid
flowchart LR
    Dev([Developer]) --> Repo[(GitHub repository)]
    Repo -->|pages.yml| Pages["GitHub Pages<br/>React SPA"]
    Repo -->|render.yaml / Dockerfile| Render["Render<br/>Express API"]
    Render --> PG[("PostgreSQL")]
    Render --> Disk[("Persistent upload storage")]
    Pages -->|"HTTPS · VITE_API_URL"| Render
```

### Backend and PostgreSQL

The Render blueprint describes a PostgreSQL database and a Node web service. Set
`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`,
`CLIENT_URL`, and `API_URL` through your hosting provider's environment
configuration. The container/start commands run `prisma migrate deploy` before
starting the API.

> [!CAUTION]
> Do not run `prisma db push --force-reset` against production. Use the
> checked-in migrations and back up the database before operational schema
> changes. Configure persistent storage if uploaded files must survive
> container replacement.

### Frontend on GitHub Pages

The `.github/workflows/pages.yml` workflow builds the frontend and deploys it
when run on the configured repository, setting the Pages base path from the
repository name.

1. Set the GitHub Actions repository variable `VITE_API_URL` to the public API origin.
2. Add the deployed frontend origin to the backend's `CORS_ORIGIN`.
3. Set `CLIENT_URL` to the public frontend URL so password-reset links are correct.
4. Serve both frontend and backend over **HTTPS**: production refresh cookies use `SameSite=None; Secure`.

> [!NOTE]
> GitHub Pages does not host the backend. No deployment has been performed or
> verified by this README.

---

## 🛠️ Troubleshooting

<details>
<summary><b>Backend cannot connect to PostgreSQL</b></summary>

Confirm the database is running and reachable; verify `DATABASE_URL`, database
name, username/password, host, port, URL-encoded credentials, and grants. Never
paste the connection string into public logs or issues.

</details>

<details>
<summary><b>Prisma reports unapplied migrations</b></summary>

From `backend/`, run `npx prisma generate` and `npm run db:migrate` against the
intended development database. Don't use a reset command to repair a database
containing data you need.

</details>

<details>
<summary><b>Backend exits with invalid environment variables</b></summary>

Ensure `backend/.env` exists and contains `DATABASE_URL`, `JWT_ACCESS_SECRET`,
and `JWT_REFRESH_SECRET`; both secrets must be at least 16 characters.

</details>

<details>
<summary><b>Port 5000 is already in use</b></summary>

Stop or reconfigure the process that owns the port, or set backend `PORT` and
update the proxy target in `frontend/vite.config.ts` to match.

</details>

<details>
<summary><b>Frontend loads but API requests fail</b></summary>

Ensure the backend is running on port 5000 and check the Vite `/api` and
`/uploads` proxy. For a separately hosted API, set frontend `VITE_API_URL` and
configure backend `CORS_ORIGIN`.

</details>

<details>
<summary><b>Login or refresh repeatedly fails</b></summary>

Check backend and database logs, JWT secrets, browser cookie settings, and
HTTPS/SameSite configuration. In production, use HTTPS and the correct
frontend/API origins.

</details>

<details>
<summary><b>Backend tests fail to connect or affect data</b></summary>

Ensure PostgreSQL is available and the test URL points only to a disposable
`aura_test` database. The test setup force-resets its target before execution.

</details>

<details>
<summary><b>Package install fails</b></summary>

Use a supported Node.js/npm version and run `npm ci` inside the relevant app
directory (`backend/` or `frontend/`).

</details>

---

## 🗺️ Roadmap

The repository does not currently maintain a formal roadmap. Features not
implemented in the source are intentionally not presented here as committed
plans.

---

## 🤝 Contributing

Contributions are welcome. Before opening a pull request:

1. Keep changes focused and preserve existing behavior.
2. Install dependencies with `npm ci` in the affected app directory.
3. Run backend tests/type checking or frontend type checking/build as relevant.
4. For backend tests, use only the dedicated disposable test database, because the suite resets its configured target.
5. Include tests for behavior changes and describe any configuration or migration requirements.
6. Never include `.env` files, credentials, user data, or generated build output.

---

## 📄 License

No license file is present in this repository. Unless a license is added, the
repository does not communicate an open-source license grant; obtain permission
from the copyright holder before redistributing or reusing the code.

---

## 👤 Author

<div align="center">

**Kareem Ahmed**

<sub>Built with React, Express, Prisma, and PostgreSQL.</sub>

<br/>

⬆️ [Back to top](#-aura)

</div>
