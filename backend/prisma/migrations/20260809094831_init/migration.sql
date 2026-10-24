-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('LINK', 'FILE', 'NOTE');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('REFRESH', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "profile_image" TEXT,
    "theme" "Theme" NOT NULL DEFAULT 'DARK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(9) NOT NULL DEFAULT '#8b5cf6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "start_date" DATE,
    "due_date" DATE,
    "start_time" VARCHAR(5),
    "end_time" VARCHAR(5),
    "notes" TEXT,
    "links" JSONB DEFAULT '[]',
    "recurrence" "RecurrenceFrequency" NOT NULL DEFAULT 'NONE',
    "recurrence_interval" INTEGER NOT NULL DEFAULT 1,
    "recurrence_end_date" DATE,
    "series_id" UUID,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "url" VARCHAR(2000),
    "type" "ResourceType" NOT NULL DEFAULT 'LINK',
    "file_name" VARCHAR(255),
    "file_path" VARCHAR(500),
    "file_size" INTEGER,
    "mime_type" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "english_words" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "word" VARCHAR(120) NOT NULL,
    "meaning" VARCHAR(500) NOT NULL,
    "example_sentence" TEXT,
    "pronunciation" VARCHAR(120),
    "notes" TEXT,
    "category" VARCHAR(80),
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_learned" BOOLEAN NOT NULL DEFAULT false,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "english_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "correct_answers" INTEGER NOT NULL,
    "wrong_answers" INTEGER NOT NULL,
    "score_percent" DOUBLE PRECISION NOT NULL,
    "details" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "deadline" DATE,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "category" VARCHAR(80),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_tokens_user_id_idx" ON "auth_tokens"("user_id");

-- CreateIndex
CREATE INDEX "auth_tokens_type_expires_at_idx" ON "auth_tokens"("type", "expires_at");

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_name_key" ON "categories"("user_id", "name");

-- CreateIndex
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");

-- CreateIndex
CREATE INDEX "tasks_user_id_status_idx" ON "tasks"("user_id", "status");

-- CreateIndex
CREATE INDEX "tasks_user_id_due_date_idx" ON "tasks"("user_id", "due_date");

-- CreateIndex
CREATE INDEX "tasks_series_id_idx" ON "tasks"("series_id");

-- CreateIndex
CREATE INDEX "tasks_user_id_recurrence_idx" ON "tasks"("user_id", "recurrence");

-- CreateIndex
CREATE INDEX "task_attachments_user_id_idx" ON "task_attachments"("user_id");

-- CreateIndex
CREATE INDEX "task_attachments_task_id_idx" ON "task_attachments"("task_id");

-- CreateIndex
CREATE INDEX "resources_user_id_idx" ON "resources"("user_id");

-- CreateIndex
CREATE INDEX "resources_user_id_type_idx" ON "resources"("user_id", "type");

-- CreateIndex
CREATE INDEX "resources_user_id_category_id_idx" ON "resources"("user_id", "category_id");

-- CreateIndex
CREATE INDEX "english_words_user_id_idx" ON "english_words"("user_id");

-- CreateIndex
CREATE INDEX "english_words_user_id_is_learned_idx" ON "english_words"("user_id", "is_learned");

-- CreateIndex
CREATE INDEX "english_words_user_id_is_favorite_idx" ON "english_words"("user_id", "is_favorite");

-- CreateIndex
CREATE INDEX "english_words_user_id_category_idx" ON "english_words"("user_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "english_words_user_id_word_key" ON "english_words"("user_id", "word");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_created_at_idx" ON "quiz_attempts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "goals_user_id_idx" ON "goals"("user_id");

-- CreateIndex
CREATE INDEX "goals_user_id_status_idx" ON "goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "goals_user_id_deadline_idx" ON "goals"("user_id", "deadline");

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "english_words" ADD CONSTRAINT "english_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
