import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/effect-schema";
import { bigint, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { Schema } from "effect";

export const audios = pgTable(
  "audios",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),

    title: text("title").notNull(),
    artist: text("artist"),
    durationSeconds: integer("duration_seconds"),

    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    sourceUrl: text("source_url"),
    thumbnailUrl: text("thumbnail_url"),

    downloadStatus: text("download_status").notNull(),

    storageKey: text("storage_key"),
    mimeType: text("mime_type"),

    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  },
  (table) => [uniqueIndex("audios_source_unique").on(table.sourceType, table.sourceId)],
);

export const AudioId = Schema.brand("AudioId")(Schema.String);
export type AudioId = typeof AudioId.Type;

export const AudioSourceId = Schema.brand("AudioSourceId")(Schema.String);
export type AudioSourceId = typeof AudioSourceId.Type;

export const AudioStorageKey = Schema.brand("AudioStorageKey")(Schema.String);
export type AudioStorageKey = typeof AudioStorageKey.Type;

export const AudioDownloadStatus = Schema.Literals(["registered", "downloading", "ready"]);
export type AudioDownloadStatus = typeof AudioDownloadStatus.Type;

export const AudioInsert = createInsertSchema(audios, {
  id: AudioId,
  sourceId: AudioSourceId,
  downloadStatus: AudioDownloadStatus,
  storageKey: AudioStorageKey,
});
export type AudioInsert = typeof AudioInsert.Type;

export const AudioUpdate = createUpdateSchema(audios, {
  id: AudioId,
  sourceId: AudioSourceId,
  downloadStatus: AudioDownloadStatus,
  storageKey: AudioStorageKey,
});
export type AudioUpdate = typeof AudioUpdate.Type;

export const AudioSelect = createSelectSchema(audios, {
  id: AudioId,
  sourceId: AudioSourceId,
  downloadStatus: AudioDownloadStatus,
  storageKey: AudioStorageKey,
});
export type AudioSelect = typeof AudioSelect.Type;
