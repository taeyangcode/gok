CREATE TABLE "todos" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
