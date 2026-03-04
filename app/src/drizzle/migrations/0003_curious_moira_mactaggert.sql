CREATE TYPE "public"."file_status" AS ENUM('public', 'private', 'preview');--> statement-breakpoint
CREATE TABLE "course_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"storage_key" text NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"status" "file_status" DEFAULT 'private' NOT NULL,
	"courseId" uuid NOT NULL,
	"sectionId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_files" ADD CONSTRAINT "course_files_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_files" ADD CONSTRAINT "course_files_sectionId_course_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."course_sections"("id") ON DELETE cascade ON UPDATE no action;