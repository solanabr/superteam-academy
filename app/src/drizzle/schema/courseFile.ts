import { pgTable, text, uuid, integer, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { relations } from "drizzle-orm";
import { CourseTable } from "./course";
import { CourseSectionTable } from "./courseSection";

export const fileStatuses = ["public", "private", "preview"] as const;
export type FileStatus = (typeof fileStatuses)[number];
export const fileStatusEnum = pgEnum("file_status", fileStatuses);

export const CourseFileTable = pgTable("course_files", {
  id,
  name: text().notNull(),
  description: text(),
  
  storageKey: text("storage_key").notNull(), 
  fileUrl: text("file_url").notNull(), 
  
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), 
  fileSize: integer("file_size").notNull(), 
  mimeType: text("mime_type").notNull(),
  
  order: integer().notNull().default(0),
  status: fileStatusEnum().notNull().default("private"),
  
  courseId: uuid()
    .notNull()
    .references(() => CourseTable.id, { onDelete: "cascade" }),
  
  sectionId: uuid()
    .references(() => CourseSectionTable.id, { onDelete: "cascade" }),
  
  createdAt,
  updatedAt,
  downloadable: boolean("downloadable").default(false).notNull(),
});

export const CourseFileRelationships = relations(CourseFileTable, ({ one }) => ({
  course: one(CourseTable, {
    fields: [CourseFileTable.courseId],
    references: [CourseTable.id],
  }),
  section: one(CourseSectionTable, {
    fields: [CourseFileTable.sectionId],
    references: [CourseSectionTable.id],
  }),
}));