import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { Effect, Layer } from "effect";

import { ServerEnv } from "#/lib/env";

const PgClientLive = Layer.unwrap(
  Effect.gen(function* () {
    const { DatabaseUrl } = yield* ServerEnv;
    return PgClient.layer({ url: DatabaseUrl }).pipe(Layer.orDie);
  }),
);

export const DrizzleDb = PgDrizzle.make().pipe(
  Effect.provide(PgDrizzle.DefaultServices),
  Effect.provide(PgClientLive),
  Effect.provide(ServerEnv.layer),
);
