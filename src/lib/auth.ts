import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { drizzle } from "drizzle-orm/node-postgres";
import { Console, Context, Effect, Layer, Redacted } from "effect";
import { Pool } from "pg";

import * as schema from "#/db/schema";
import { ServerEnv } from "#/lib/env";

export class PgPool extends Context.Service<PgPool, Pool>()("@gok/auth/PgPool") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { DatabaseUrl } = yield* ServerEnv;

      return yield* Effect.acquireRelease(
        Effect.gen(function* () {
          const pool = new Pool({
            connectionString: Redacted.value(DatabaseUrl),
          });
          yield* Console.info("Pool opened.", pool.options);
          return pool;
        }),
        Effect.fn(function* (pool) {
          yield* Console.info("Pool closed.", pool.options);
          yield* Effect.promise(() => pool.end());
        }),
      );
    }),
  );
}

export class ServerAuth extends Context.Service<ServerAuth, BetterAuth>()("@gok/auth/ServerAuth") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { BetterAuthUrl, GoogleClientId, GoogleClientSecret } = yield* ServerEnv;

      const pool = yield* PgPool;
      const db = drizzle({ client: pool });

      return makeServerAuth(
        db,
        Redacted.value(BetterAuthUrl),
        Redacted.value(GoogleClientId),
        Redacted.value(GoogleClientSecret),
      );
    }),
  );
}

type BetterAuth = ReturnType<typeof makeServerAuth>;

function makeServerAuth(
  db: ReturnType<typeof drizzle>,
  baseURL: string,
  googleClientId: string,
  googleClientSecret: string,
) {
  return betterAuth({
    baseURL: baseURL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
      camelCase: false,
    }),
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        prompt: "select_account",
      },
    },
    plugins: [tanstackStartCookies()],
  });
}
