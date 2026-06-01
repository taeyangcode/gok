CREATE TABLE "audios" (
	"id" text PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"artist" text,
	"duration_seconds" integer,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"source_url" text,
	"thumbnail_url" text,
	"download_status" text NOT NULL,
	"storage_key" text,
	"mime_type" text,
	"file_size_bytes" bigint
);
--> statement-breakpoint
CREATE UNIQUE INDEX "audios_source_unique" ON "audios" ("source_type","source_id");