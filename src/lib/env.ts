import { NodeFileSystem } from "@effect/platform-node";
import { Config, Context, Effect, Layer, Schema } from "effect";
import { ConfigProvider } from "effect";
import { Redacted } from "effect";

export class ServerEnv extends Context.Service<
  ServerEnv,
  {
    BetterAuthUrl: Redacted.Redacted<string>;
    BetterAuthSecret: Redacted.Redacted<string>;

    DatabaseUrl: Redacted.Redacted<string>;

    PgPort: Redacted.Redacted<number>;
  }
>()("@gok/env/ServerEnv") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const BetterAuthUrl = yield* Config.redacted("BETTER_AUTH_URL").pipe(Effect.orDie);
      const BetterAuthSecret = yield* Config.redacted("BETTER_AUTH_SECRET").pipe(Effect.orDie);

      const DatabaseUrl = yield* Config.redacted("DATABASE_URL").pipe(Effect.orDie);

      const PgPort = yield* Config.schema(Schema.Redacted(Schema.Number), "PGPORT").pipe(
        Effect.orDie,
      );

      return {
        BetterAuthUrl,
        BetterAuthSecret,
        DatabaseUrl,
        PgPort,
      };
    }),
  );
}

export const EnvironmentLive = ConfigProvider.layerAdd(
  ConfigProvider.fromDotEnv({
    path: ".env.local",
    expandVariables: true,
  }),
  { asPrimary: true },
).pipe(Layer.orDie, Layer.provide(NodeFileSystem.layer));
