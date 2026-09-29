import { boolean, integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

export const contents = pgTable("contents", {
  id: serial().primaryKey(),
  type: text().notNull(),
  title: text().notNull(),
  description: text().notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  isLive: boolean("is_live").notNull().default(false),
  published: boolean().notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial().primaryKey(),
  contentId: integer("content_id").references(() => contents.id, { onDelete: "cascade" }),
  kind: text().notNull(),
  title: text().notNull(),
  message: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationReads = pgTable("notification_reads", {
  notificationId: integer("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.notificationId, table.userId] })]);
