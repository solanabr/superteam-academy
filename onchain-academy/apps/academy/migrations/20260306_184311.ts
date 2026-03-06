import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "xp_records" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"amount" numeric NOT NULL,
  	"timestamp" timestamp(3) with time zone NOT NULL,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "xp_records_id" integer;
  ALTER TABLE "xp_records" ADD CONSTRAINT "xp_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "xp_records_user_idx" ON "xp_records" USING btree ("user_id");
  CREATE INDEX "xp_records_timestamp_idx" ON "xp_records" USING btree ("timestamp");
  CREATE INDEX "xp_records_updated_at_idx" ON "xp_records" USING btree ("updated_at");
  CREATE INDEX "xp_records_created_at_idx" ON "xp_records" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_xp_records_fk" FOREIGN KEY ("xp_records_id") REFERENCES "public"."xp_records"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_xp_records_id_idx" ON "payload_locked_documents_rels" USING btree ("xp_records_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "xp_records" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "xp_records" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_xp_records_fk";
  
  DROP INDEX "payload_locked_documents_rels_xp_records_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "xp_records_id";`)
}
