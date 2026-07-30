-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "PremiumPlan" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('pdf', 'photograph', 'scan', 'book', 'handout');

-- CreateEnum
CREATE TYPE "KnowledgeSourceProcessingStatus" AS ENUM ('uploaded', 'queued', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AtomRelationshipType" AS ENUM ('prerequisite', 'part_of', 'contains', 'cause', 'consequence', 'analogy', 'contrast', 'dependency', 'equivalence', 'generalization', 'specialization');

-- CreateEnum
CREATE TYPE "CognitiveDependencyStrength" AS ENUM ('strong', 'weak');

-- CreateEnum
CREATE TYPE "LearningObjective" AS ENUM ('know', 'understand', 'connect', 'distinguish', 'apply', 'recall', 'transfer');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('explain', 'image_explain', 'quiz', 'multiple_choice', 'true_false', 'fill_blank', 'blurting', 'feynman', 'timeline', 'match', 'order', 'error_detection', 'memory_recall', 'visual_recall', 'audio', 'future');

-- CreateEnum
CREATE TYPE "CognitiveObjective" AS ENUM ('comprehension', 'memory', 'retrieval', 'connection', 'stability');

-- CreateEnum
CREATE TYPE "UserAtomLearningState" AS ENUM ('locked', 'available', 'learning', 'practicing', 'mastered', 'review', 'forgotten', 'archived');

-- CreateEnum
CREATE TYPE "SessionEventType" AS ENUM ('open_card', 'close_card', 'correct_answer', 'wrong_answer', 'skip', 'replay', 'voice_recording', 'image_zoom', 'hint', 'exit', 'resume', 'pause');

-- CreateEnum
CREATE TYPE "SessionEventOutcome" AS ENUM ('success', 'failure', 'skipped', 'neutral');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('scheduled', 'completed', 'missed', 'cancelled');

-- CreateEnum
CREATE TYPE "ReviewOutcome" AS ENUM ('success', 'partial', 'failure');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('pending', 'uploading', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('queued', 'running', 'retry', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AIJobStep" AS ENUM ('ocr', 'text_cleaning', 'structure_recognition', 'image_extraction', 'llm_extraction', 'json_validation', 'normalization', 'persistence');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('review_reminder', 'streak_reminder', 'achievement', 'processing_complete', 'processing_failed', 'system');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'opened', 'dismissed');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('study', 'mastery', 'streak', 'review', 'exploration');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_access_at" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'it',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Rome',
    "school_grade" TEXT,
    "school_year" TEXT,
    "personal_goals" JSONB NOT NULL DEFAULT '[]',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "profile_image_url" TEXT,
    "premium_plan" "PremiumPlan" NOT NULL DEFAULT 'free',
    "account_status" "AccountStatus" NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "source_type" "KnowledgeSourceType" NOT NULL,
    "page_count" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'it',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "parser_version" TEXT,
    "prompt_version" TEXT,
    "processing_status" "KnowledgeSourceProcessingStatus" NOT NULL DEFAULT 'uploaded',
    "file_size_bytes" BIGINT NOT NULL DEFAULT 0,
    "file_hash" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "knowledge_source_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "chapter_number" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "estimated_study_time_minutes" INTEGER,
    "difficulty_level" INTEGER,
    "atom_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" UUID NOT NULL,
    "knowledge_source_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "page_number" INTEGER,
    "caption" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "course_id" UUID,
    "knowledge_source_id" UUID,
    "status" "UploadStatus" NOT NULL DEFAULT 'pending',
    "image_ids" JSONB NOT NULL DEFAULT '[]',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" UUID NOT NULL,
    "knowledge_source_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'queued',
    "current_step" "AIJobStep",
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "prompt_version" TEXT,
    "parser_version" TEXT,
    "error_message" TEXT,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atoms" (
    "id" UUID NOT NULL,
    "knowledge_source_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "importance" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "abstraction_level" INTEGER NOT NULL,
    "logical_order" INTEGER NOT NULL,
    "original_order" INTEGER NOT NULL,
    "learning_objectives" JSONB NOT NULL DEFAULT '[]',
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "aliases" JSONB NOT NULL DEFAULT '[]',
    "formulas" JSONB NOT NULL DEFAULT '[]',
    "definitions" JSONB NOT NULL DEFAULT '[]',
    "examples" JSONB NOT NULL DEFAULT '[]',
    "counter_examples" JSONB NOT NULL DEFAULT '[]',
    "common_mistakes" JSONB NOT NULL DEFAULT '[]',
    "misconceptions" JSONB NOT NULL DEFAULT '[]',
    "applications" JSONB NOT NULL DEFAULT '[]',
    "historical_context" TEXT,
    "notes" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "tables" JSONB NOT NULL DEFAULT '[]',
    "diagrams" JSONB NOT NULL DEFAULT '[]',
    "equations" JSONB NOT NULL DEFAULT '[]',
    "citations" JSONB NOT NULL DEFAULT '[]',
    "page_references" JSONB NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL,
    "ai_version" TEXT NOT NULL,
    "tokens_used" INTEGER,
    "estimated_study_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atom_prerequisites" (
    "atom_id" UUID NOT NULL,
    "prerequisite_atom_id" UUID NOT NULL,

    CONSTRAINT "atom_prerequisites_pkey" PRIMARY KEY ("atom_id","prerequisite_atom_id")
);

-- CreateTable
CREATE TABLE "atom_relationships" (
    "id" UUID NOT NULL,
    "source_atom_id" UUID NOT NULL,
    "target_atom_id" UUID NOT NULL,
    "type" "AtomRelationshipType" NOT NULL,
    "dependency_strength" "CognitiveDependencyStrength",

    CONSTRAINT "atom_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL,
    "atom_id" UUID NOT NULL,
    "type" "CardType" NOT NULL,
    "order" INTEGER NOT NULL,
    "cognitive_objective" "CognitiveObjective" NOT NULL,
    "prompt" TEXT,
    "text" TEXT NOT NULL,
    "explanation" TEXT,
    "correct_feedback" TEXT,
    "incorrect_feedback" TEXT,
    "estimated_duration_seconds" INTEGER NOT NULL,
    "payload" JSONB,
    "ai_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_atom_states" (
    "user_id" UUID NOT NULL,
    "atom_id" UUID NOT NULL,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_stage" "UserAtomLearningState" NOT NULL DEFAULT 'locked',
    "exposure_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "correct_answer_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_answer_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3),
    "next_review_at" TIMESTAMP(3),
    "average_response_time_ms" INTEGER,
    "total_study_time_ms" BIGINT NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "estimated_decay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comprehension_level" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_algorithm_used" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_atom_states_pkey" PRIMARY KEY ("user_id","atom_id")
);

-- CreateTable
CREATE TABLE "user_card_states" (
    "user_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "correct_answer_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_answer_count" INTEGER NOT NULL DEFAULT 0,
    "average_response_time_ms" INTEGER,
    "last_answered_at" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perceived_difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "liked" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_card_states_pkey" PRIMARY KEY ("user_id","card_id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "duration_ms" BIGINT,
    "cards_viewed" INTEGER NOT NULL DEFAULT 0,
    "atoms_completed" INTEGER NOT NULL DEFAULT 0,
    "reviews_completed" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "correct_answer_count" INTEGER NOT NULL DEFAULT 0,
    "focus_score" DOUBLE PRECISION,
    "fatigue_score" DOUBLE PRECISION,
    "initial_motivation" DOUBLE PRECISION,
    "final_motivation" DOUBLE PRECISION,
    "device" TEXT,
    "app_version" TEXT,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_events" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "SessionEventType" NOT NULL,
    "atom_id" UUID,
    "card_id" UUID,
    "duration_ms" INTEGER,
    "outcome" "SessionEventOutcome",
    "declared_confidence" DOUBLE PRECISION,
    "response_time_ms" INTEGER,
    "feed_position" INTEGER,
    "swipe_count" INTEGER,

    CONSTRAINT "session_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "atom_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "outcome" "ReviewOutcome",
    "algorithm" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'scheduled',

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_statistics" (
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "study_time_ms" BIGINT NOT NULL DEFAULT 0,
    "cards_completed" INTEGER NOT NULL DEFAULT 0,
    "atoms_completed" INTEGER NOT NULL DEFAULT 0,
    "reviews_completed" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_focus" DOUBLE PRECISION,
    "average_mastery" DOUBLE PRECISION,
    "daily_streak" INTEGER NOT NULL DEFAULT 0,
    "activity_level" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_statistics_pkey" PRIMARY KEY ("user_id","date")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "level" INTEGER NOT NULL,
    "icon" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "reward" TEXT,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "user_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id","achievement_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_account_status_idx" ON "users"("account_status");

-- CreateIndex
CREATE INDEX "subjects_user_id_idx" ON "subjects"("user_id");

-- CreateIndex
CREATE INDEX "subjects_user_id_display_order_idx" ON "subjects"("user_id", "display_order");

-- CreateIndex
CREATE INDEX "courses_user_id_idx" ON "courses"("user_id");

-- CreateIndex
CREATE INDEX "courses_subject_id_idx" ON "courses"("subject_id");

-- CreateIndex
CREATE INDEX "knowledge_sources_user_id_idx" ON "knowledge_sources"("user_id");

-- CreateIndex
CREATE INDEX "knowledge_sources_subject_id_idx" ON "knowledge_sources"("subject_id");

-- CreateIndex
CREATE INDEX "knowledge_sources_processing_status_idx" ON "knowledge_sources"("processing_status");

-- CreateIndex
CREATE INDEX "knowledge_sources_file_hash_idx" ON "knowledge_sources"("file_hash");

-- CreateIndex
CREATE INDEX "chapters_course_id_idx" ON "chapters"("course_id");

-- CreateIndex
CREATE INDEX "chapters_subject_id_idx" ON "chapters"("subject_id");

-- CreateIndex
CREATE INDEX "chapters_knowledge_source_id_idx" ON "chapters"("knowledge_source_id");

-- CreateIndex
CREATE INDEX "images_knowledge_source_id_idx" ON "images"("knowledge_source_id");

-- CreateIndex
CREATE INDEX "images_owner_id_idx" ON "images"("owner_id");

-- CreateIndex
CREATE INDEX "images_hash_idx" ON "images"("hash");

-- CreateIndex
CREATE INDEX "uploads_user_id_idx" ON "uploads"("user_id");

-- CreateIndex
CREATE INDEX "uploads_status_idx" ON "uploads"("status");

-- CreateIndex
CREATE INDEX "uploads_knowledge_source_id_idx" ON "uploads"("knowledge_source_id");

-- CreateIndex
CREATE INDEX "ai_jobs_knowledge_source_id_idx" ON "ai_jobs"("knowledge_source_id");

-- CreateIndex
CREATE INDEX "ai_jobs_user_id_idx" ON "ai_jobs"("user_id");

-- CreateIndex
CREATE INDEX "ai_jobs_status_idx" ON "ai_jobs"("status");

-- CreateIndex
CREATE INDEX "atoms_knowledge_source_id_idx" ON "atoms"("knowledge_source_id");

-- CreateIndex
CREATE INDEX "atoms_subject_id_idx" ON "atoms"("subject_id");

-- CreateIndex
CREATE INDEX "atoms_knowledge_source_id_logical_order_idx" ON "atoms"("knowledge_source_id", "logical_order");

-- CreateIndex
CREATE INDEX "atom_prerequisites_prerequisite_atom_id_idx" ON "atom_prerequisites"("prerequisite_atom_id");

-- CreateIndex
CREATE INDEX "atom_relationships_target_atom_id_idx" ON "atom_relationships"("target_atom_id");

-- CreateIndex
CREATE UNIQUE INDEX "atom_relationships_source_atom_id_target_atom_id_type_key" ON "atom_relationships"("source_atom_id", "target_atom_id", "type");

-- CreateIndex
CREATE INDEX "cards_atom_id_idx" ON "cards"("atom_id");

-- CreateIndex
CREATE INDEX "cards_atom_id_order_idx" ON "cards"("atom_id", "order");

-- CreateIndex
CREATE INDEX "user_atom_states_user_id_idx" ON "user_atom_states"("user_id");

-- CreateIndex
CREATE INDEX "user_atom_states_atom_id_idx" ON "user_atom_states"("atom_id");

-- CreateIndex
CREATE INDEX "user_atom_states_user_id_next_review_at_idx" ON "user_atom_states"("user_id", "next_review_at");

-- CreateIndex
CREATE INDEX "user_atom_states_user_id_current_stage_idx" ON "user_atom_states"("user_id", "current_stage");

-- CreateIndex
CREATE INDEX "user_card_states_user_id_idx" ON "user_card_states"("user_id");

-- CreateIndex
CREATE INDEX "user_card_states_card_id_idx" ON "user_card_states"("card_id");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_idx" ON "study_sessions"("user_id");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_started_at_idx" ON "study_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "session_events_session_id_idx" ON "session_events"("session_id");

-- CreateIndex
CREATE INDEX "session_events_session_id_timestamp_idx" ON "session_events"("session_id", "timestamp");

-- CreateIndex
CREATE INDEX "session_events_atom_id_idx" ON "session_events"("atom_id");

-- CreateIndex
CREATE INDEX "session_events_card_id_idx" ON "session_events"("card_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_scheduled_at_idx" ON "reviews"("user_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "reviews_user_id_status_idx" ON "reviews"("user_id", "status");

-- CreateIndex
CREATE INDEX "reviews_atom_id_idx" ON "reviews"("atom_id");

-- CreateIndex
CREATE INDEX "daily_statistics_user_id_idx" ON "daily_statistics"("user_id");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_idx" ON "notifications"("user_id", "status");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atoms" ADD CONSTRAINT "atoms_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atoms" ADD CONSTRAINT "atoms_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atom_prerequisites" ADD CONSTRAINT "atom_prerequisites_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atom_prerequisites" ADD CONSTRAINT "atom_prerequisites_prerequisite_atom_id_fkey" FOREIGN KEY ("prerequisite_atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atom_relationships" ADD CONSTRAINT "atom_relationships_source_atom_id_fkey" FOREIGN KEY ("source_atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atom_relationships" ADD CONSTRAINT "atom_relationships_target_atom_id_fkey" FOREIGN KEY ("target_atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_atom_states" ADD CONSTRAINT "user_atom_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_atom_states" ADD CONSTRAINT "user_atom_states_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_card_states" ADD CONSTRAINT "user_card_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_card_states" ADD CONSTRAINT "user_card_states_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_events" ADD CONSTRAINT "session_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_events" ADD CONSTRAINT "session_events_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "atoms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_events" ADD CONSTRAINT "session_events_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_statistics" ADD CONSTRAINT "daily_statistics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
