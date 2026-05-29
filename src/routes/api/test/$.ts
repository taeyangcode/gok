import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

import { DrizzleDb } from "#/db";
import { todos } from "#/db/schema";
import { Runtime } from "#/server/runtime";

export const Route = createFileRoute("/api/test/$")({
  server: {
    handlers: {
      GET: ({ request }) =>
        Runtime.runPromise(
          Effect.gen(function* () {
            const db = yield* DrizzleDb;
            const result = yield* db.insert(todos).values({ title: "Test" }).returning();

            return new Response(JSON.stringify(result));
          }),
        ),
      POST: ({ request }) => {
        return new Response("Hi");
      },
    },
  },
});
