import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'es', 'pt-br');
  CREATE TYPE "public"."enum_users_auth_method" AS ENUM('wallet', 'google', 'github');
  CREATE TYPE "public"."enum_users_role" AS ENUM('learner', 'instructor', 'admin');
  CREATE TYPE "public"."enum_users_locale" AS ENUM('en', 'pt-br', 'es');
  CREATE TYPE "public"."enum_courses_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_lessons_type" AS ENUM('video', 'reading', 'code_challenge', 'quiz', 'hybrid');
  CREATE TYPE "public"."enum_lesson_contents_blocks_block_type" AS ENUM('markdown', 'video', 'callout');
  CREATE TYPE "public"."enum_lesson_contents_blocks_callout_variant" AS ENUM('info', 'warning', 'tip');
  CREATE TYPE "public"."enum_lesson_contents_quiz_questions_question_type" AS ENUM('radio', 'checkbox', 'code');
  CREATE TYPE "public"."enum_lesson_contents_challenge_language" AS ENUM('rust', 'typescript', 'json');
  CREATE TYPE "public"."enum_reviews_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"better_auth_id" varchar,
  	"onboarding_complete" boolean DEFAULT false,
  	"wallet_address" varchar,
  	"auth_method" "enum_users_auth_method" DEFAULT 'wallet',
  	"username" varchar,
  	"display_name" varchar,
  	"avatar_id" integer,
  	"bio" varchar,
  	"role" "enum_users_role" DEFAULT 'learner',
  	"social_links_github" varchar,
  	"social_links_twitter" varchar,
  	"social_links_website" varchar,
  	"locale" "enum_users_locale" DEFAULT 'en',
  	"is_public_profile" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "courses_learning_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_learning_outcomes_locales" (
  	"outcome" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_prerequisites" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_prerequisites_locales" (
  	"prerequisite" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"difficulty" "enum_courses_difficulty" NOT NULL,
  	"duration" varchar,
  	"total_lessons" numeric DEFAULT 0,
  	"xp_reward" numeric NOT NULL,
  	"topic" varchar,
  	"thumbnail_id" integer,
  	"enrollment_count" numeric DEFAULT 0,
  	"rating" numeric DEFAULT 0,
  	"rating_count" numeric DEFAULT 0,
  	"last_updated" varchar,
  	"language" varchar DEFAULT 'English',
  	"track_id" numeric,
  	"track_level" numeric,
  	"on_chain_course_id" varchar,
  	"instructor_id" integer,
  	"status" "enum_courses_status" DEFAULT 'draft',
  	"certificate" boolean DEFAULT false,
  	"on_chain_credential" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "courses_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"long_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "modules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"course_id" integer NOT NULL,
  	"sort_order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "modules_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "lessons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"module_id" integer NOT NULL,
  	"type" "enum_lessons_type" NOT NULL,
  	"duration" varchar,
  	"xp_reward" numeric NOT NULL,
  	"sort_order" numeric DEFAULT 0 NOT NULL,
  	"on_chain_lesson_index" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "lessons_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "lesson_contents_blocks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_type" "enum_lesson_contents_blocks_block_type" NOT NULL,
  	"url" varchar,
  	"callout_variant" "enum_lesson_contents_blocks_callout_variant"
  );
  
  CREATE TABLE "lesson_contents_blocks_locales" (
  	"content" varchar,
  	"video_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lesson_contents_challenge_objectives" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "lesson_contents_challenge_objectives_locales" (
  	"objective" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lesson_contents_challenge_test_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"expected" varchar NOT NULL
  );
  
  CREATE TABLE "lesson_contents_challenge_test_cases_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lesson_contents_quiz_questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "lesson_contents_quiz_questions_options_locales" (
  	"option" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lesson_contents_quiz_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question_type" "enum_lesson_contents_quiz_questions_question_type" NOT NULL,
  	"correct_index" numeric,
  	"correct_indices" jsonb,
  	"starter_code" varchar,
  	"language" varchar,
  	"expected" varchar
  );
  
  CREATE TABLE "lesson_contents_quiz_questions_locales" (
  	"prompt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lesson_contents_hints" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "lesson_contents_hints_locales" (
  	"hint" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lesson_contents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lesson_id" integer NOT NULL,
  	"challenge_starter_code" varchar,
  	"challenge_language" "enum_lesson_contents_challenge_language",
  	"challenge_expected_output" varchar,
  	"challenge_solution_code" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "lesson_contents_locales" (
  	"challenge_prompt" varchar,
  	"solution" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"course_id" integer NOT NULL,
  	"user_id" integer,
  	"reviewer_name" varchar,
  	"rating" numeric NOT NULL,
  	"display_date" varchar,
  	"status" "enum_reviews_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "streaks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"current_streak" numeric DEFAULT 0,
  	"longest_streak" numeric DEFAULT 0,
  	"last_activity_date" timestamp(3) with time zone,
  	"history" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"courses_id" integer,
  	"modules_id" integer,
  	"lessons_id" integer,
  	"lesson_contents_id" integer,
  	"reviews_id" integer,
  	"streaks_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_learning_outcomes" ADD CONSTRAINT "courses_learning_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_learning_outcomes_locales" ADD CONSTRAINT "courses_learning_outcomes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_learning_outcomes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_prerequisites" ADD CONSTRAINT "courses_prerequisites_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_prerequisites_locales" ADD CONSTRAINT "courses_prerequisites_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_prerequisites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_locales" ADD CONSTRAINT "courses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modules_locales" ADD CONSTRAINT "modules_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_locales" ADD CONSTRAINT "lessons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_blocks" ADD CONSTRAINT "lesson_contents_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_blocks_locales" ADD CONSTRAINT "lesson_contents_blocks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_challenge_objectives" ADD CONSTRAINT "lesson_contents_challenge_objectives_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_challenge_objectives_locales" ADD CONSTRAINT "lesson_contents_challenge_objectives_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents_challenge_objectives"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_challenge_test_cases" ADD CONSTRAINT "lesson_contents_challenge_test_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_challenge_test_cases_locales" ADD CONSTRAINT "lesson_contents_challenge_test_cases_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents_challenge_test_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_quiz_questions_options" ADD CONSTRAINT "lesson_contents_quiz_questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_quiz_questions_options_locales" ADD CONSTRAINT "lesson_contents_quiz_questions_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents_quiz_questions_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_quiz_questions" ADD CONSTRAINT "lesson_contents_quiz_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_quiz_questions_locales" ADD CONSTRAINT "lesson_contents_quiz_questions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_hints" ADD CONSTRAINT "lesson_contents_hints_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents_hints_locales" ADD CONSTRAINT "lesson_contents_hints_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents_hints"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lesson_contents_locales" ADD CONSTRAINT "lesson_contents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lesson_contents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews_locales" ADD CONSTRAINT "reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modules_fk" FOREIGN KEY ("modules_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lesson_contents_fk" FOREIGN KEY ("lesson_contents_id") REFERENCES "public"."lesson_contents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_streaks_fk" FOREIGN KEY ("streaks_id") REFERENCES "public"."streaks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "users_better_auth_id_idx" ON "users" USING btree ("better_auth_id");
  CREATE UNIQUE INDEX "users_wallet_address_idx" ON "users" USING btree ("wallet_address");
  CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "courses_learning_outcomes_order_idx" ON "courses_learning_outcomes" USING btree ("_order");
  CREATE INDEX "courses_learning_outcomes_parent_id_idx" ON "courses_learning_outcomes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_learning_outcomes_locales_locale_parent_id_unique" ON "courses_learning_outcomes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_prerequisites_order_idx" ON "courses_prerequisites" USING btree ("_order");
  CREATE INDEX "courses_prerequisites_parent_id_idx" ON "courses_prerequisites" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_prerequisites_locales_locale_parent_id_unique" ON "courses_prerequisites_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
  CREATE INDEX "courses_difficulty_idx" ON "courses" USING btree ("difficulty");
  CREATE INDEX "courses_topic_idx" ON "courses" USING btree ("topic");
  CREATE INDEX "courses_thumbnail_idx" ON "courses" USING btree ("thumbnail_id");
  CREATE INDEX "courses_on_chain_course_id_idx" ON "courses" USING btree ("on_chain_course_id");
  CREATE INDEX "courses_instructor_idx" ON "courses" USING btree ("instructor_id");
  CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE UNIQUE INDEX "courses_locales_locale_parent_id_unique" ON "courses_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "modules_course_idx" ON "modules" USING btree ("course_id");
  CREATE INDEX "modules_updated_at_idx" ON "modules" USING btree ("updated_at");
  CREATE INDEX "modules_created_at_idx" ON "modules" USING btree ("created_at");
  CREATE UNIQUE INDEX "modules_locales_locale_parent_id_unique" ON "modules_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lessons_module_idx" ON "lessons" USING btree ("module_id");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  CREATE UNIQUE INDEX "lessons_locales_locale_parent_id_unique" ON "lessons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lesson_contents_blocks_order_idx" ON "lesson_contents_blocks" USING btree ("_order");
  CREATE INDEX "lesson_contents_blocks_parent_id_idx" ON "lesson_contents_blocks" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "lesson_contents_blocks_locales_locale_parent_id_unique" ON "lesson_contents_blocks_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lesson_contents_challenge_objectives_order_idx" ON "lesson_contents_challenge_objectives" USING btree ("_order");
  CREATE INDEX "lesson_contents_challenge_objectives_parent_id_idx" ON "lesson_contents_challenge_objectives" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "lesson_contents_challenge_objectives_locales_locale_parent_i" ON "lesson_contents_challenge_objectives_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lesson_contents_challenge_test_cases_order_idx" ON "lesson_contents_challenge_test_cases" USING btree ("_order");
  CREATE INDEX "lesson_contents_challenge_test_cases_parent_id_idx" ON "lesson_contents_challenge_test_cases" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "lesson_contents_challenge_test_cases_locales_locale_parent_i" ON "lesson_contents_challenge_test_cases_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lesson_contents_quiz_questions_options_order_idx" ON "lesson_contents_quiz_questions_options" USING btree ("_order");
  CREATE INDEX "lesson_contents_quiz_questions_options_parent_id_idx" ON "lesson_contents_quiz_questions_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "lesson_contents_quiz_questions_options_locales_locale_parent" ON "lesson_contents_quiz_questions_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lesson_contents_quiz_questions_order_idx" ON "lesson_contents_quiz_questions" USING btree ("_order");
  CREATE INDEX "lesson_contents_quiz_questions_parent_id_idx" ON "lesson_contents_quiz_questions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "lesson_contents_quiz_questions_locales_locale_parent_id_uniq" ON "lesson_contents_quiz_questions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lesson_contents_hints_order_idx" ON "lesson_contents_hints" USING btree ("_order");
  CREATE INDEX "lesson_contents_hints_parent_id_idx" ON "lesson_contents_hints" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "lesson_contents_hints_locales_locale_parent_id_unique" ON "lesson_contents_hints_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "lesson_contents_lesson_idx" ON "lesson_contents" USING btree ("lesson_id");
  CREATE INDEX "lesson_contents_updated_at_idx" ON "lesson_contents" USING btree ("updated_at");
  CREATE INDEX "lesson_contents_created_at_idx" ON "lesson_contents" USING btree ("created_at");
  CREATE UNIQUE INDEX "lesson_contents_locales_locale_parent_id_unique" ON "lesson_contents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "reviews_course_idx" ON "reviews" USING btree ("course_id");
  CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");
  CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE UNIQUE INDEX "reviews_locales_locale_parent_id_unique" ON "reviews_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "streaks_user_idx" ON "streaks" USING btree ("user_id");
  CREATE INDEX "streaks_updated_at_idx" ON "streaks" USING btree ("updated_at");
  CREATE INDEX "streaks_created_at_idx" ON "streaks" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_modules_id_idx" ON "payload_locked_documents_rels" USING btree ("modules_id");
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");
  CREATE INDEX "payload_locked_documents_rels_lesson_contents_id_idx" ON "payload_locked_documents_rels" USING btree ("lesson_contents_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_streaks_id_idx" ON "payload_locked_documents_rels" USING btree ("streaks_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "courses_learning_outcomes" CASCADE;
  DROP TABLE "courses_learning_outcomes_locales" CASCADE;
  DROP TABLE "courses_prerequisites" CASCADE;
  DROP TABLE "courses_prerequisites_locales" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_locales" CASCADE;
  DROP TABLE "modules" CASCADE;
  DROP TABLE "modules_locales" CASCADE;
  DROP TABLE "lessons" CASCADE;
  DROP TABLE "lessons_locales" CASCADE;
  DROP TABLE "lesson_contents_blocks" CASCADE;
  DROP TABLE "lesson_contents_blocks_locales" CASCADE;
  DROP TABLE "lesson_contents_challenge_objectives" CASCADE;
  DROP TABLE "lesson_contents_challenge_objectives_locales" CASCADE;
  DROP TABLE "lesson_contents_challenge_test_cases" CASCADE;
  DROP TABLE "lesson_contents_challenge_test_cases_locales" CASCADE;
  DROP TABLE "lesson_contents_quiz_questions_options" CASCADE;
  DROP TABLE "lesson_contents_quiz_questions_options_locales" CASCADE;
  DROP TABLE "lesson_contents_quiz_questions" CASCADE;
  DROP TABLE "lesson_contents_quiz_questions_locales" CASCADE;
  DROP TABLE "lesson_contents_hints" CASCADE;
  DROP TABLE "lesson_contents_hints_locales" CASCADE;
  DROP TABLE "lesson_contents" CASCADE;
  DROP TABLE "lesson_contents_locales" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "reviews_locales" CASCADE;
  DROP TABLE "streaks" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_auth_method";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_locale";
  DROP TYPE "public"."enum_courses_difficulty";
  DROP TYPE "public"."enum_courses_status";
  DROP TYPE "public"."enum_lessons_type";
  DROP TYPE "public"."enum_lesson_contents_blocks_block_type";
  DROP TYPE "public"."enum_lesson_contents_blocks_callout_variant";
  DROP TYPE "public"."enum_lesson_contents_quiz_questions_question_type";
  DROP TYPE "public"."enum_lesson_contents_challenge_language";
  DROP TYPE "public"."enum_reviews_status";`)
}
