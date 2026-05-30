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
            const auth = yield* ServerAuth;
            return yield* Effect.tryPromise(() => auth.handler(request));
          }),
        ),
      POST: ({ request }) =>
        Runtime.runPromise(
          Effect.gen(function* () {
            const auth = yield* ServerAuth;
            return yield* Effect.tryPromise(() => auth.handler(request));
          }),
        ),
    },
  },
});
