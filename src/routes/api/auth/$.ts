import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

import { ServerAuth } from "#/lib/auth";
import { Runtime } from "#/server/runtime";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) =>
        Runtime.runPromise(
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan({
              "http.method": request.method,
              "url.path": request.url,
            });

            const auth = yield* ServerAuth;
            return yield* Effect.tryPromise(() => auth.handler(request)).pipe(
              Effect.tapError((error) => Effect.annotateCurrentSpan({ error: error.toJSON() })),
            );
          }).pipe(Effect.withSpan("@gok/api/auth/GET")),
        ),
      POST: ({ request }) =>
        Runtime.runPromise(
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan({
              "http.method": request.method,
              "url.path": request.url,
            });

            const auth = yield* ServerAuth;
            return yield* Effect.tryPromise(() => auth.handler(request)).pipe(
              Effect.tapError((error) => Effect.annotateCurrentSpan({ error: error.toJSON() })),
            );
          }).pipe(Effect.withSpan("@gok/api/auth/POST")),
        ),
    },
  },
});
