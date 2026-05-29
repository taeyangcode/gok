import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { Effect, Layer } from "effect";
import { types } from "pg";

import { ServerEnv } from "#/lib/env";

export const PgClientLive = Layer.unwrap(
  Effect.gen(function* () {
    const { DatabaseUrl } = yield* ServerEnv;

    return PgClient.layer({
      url: DatabaseUrl,
      // https://orm.drizzle.team/docs/connect-effect-postgres
      types: {
        getTypeParser: (typeId, format) => {
          if ([1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(typeId)) {
            return (val: any) => val;
          }
          return types.getTypeParser(typeId, format);
        },
      },
    }).pipe(Layer.orDie);
  }),
);

export const DrizzleDb = PgDrizzle.make().pipe(Effect.provide(PgDrizzle.DefaultServices));
