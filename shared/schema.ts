import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const qrRequestSchema = z.object({
  url: z.string().min(1, "URL is required").url("Must be a valid URL"),
  format: z.enum(["png", "json"]).default("json"),
});

export type QRRequest = z.infer<typeof qrRequestSchema>;

export interface QRResponse {
  qr_code: string;
  url: string;
}

export interface QRError {
  error: true;
  code: string;
  message: string;
  detail?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}
