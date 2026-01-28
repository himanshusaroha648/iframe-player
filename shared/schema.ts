import { pgTable, text, varchar, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We define the schema here for type sharing, even though we use Supabase directly
export const iframe = pgTable("iframe", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  xnxxUrl: text("xnxx_url"),
  m3u8Url: text("m3u8_url"),
  nameTitle: text("name_title"),
  videoId: varchar("video_id").unique().notNull(),
});

export const insertIframeSchema = createInsertSchema(iframe).pick({
  xnxxUrl: true,
  m3u8Url: true,
  nameTitle: true,
  videoId: true,
});

export type Iframe = typeof iframe.$inferSelect;
export type InsertIframe = z.infer<typeof insertIframeSchema>;
