import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Effect, Redacted } from "effect";
import { Pool } from "pg";

import { ServerEnv } from "#/lib/env";

export const auth = Effect.gen(function* () {
  const { DatabaseUrl } = yield* ServerEnv;

  return betterAuth({
    database: new Pool({
      connectionString: Redacted.value(DatabaseUrl),
    }),
    plugins: [tanstackStartCookies()],
  });
});
