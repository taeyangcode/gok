import { NodeFileSystem } from "@effect/platform-node";
import { Config, Context, Effect, Layer, Match, Schema } from "effect";
import { ConfigProvider } from "effect";
import { Redacted } from "effect";

export class ServerEnv extends Context.Service<
  ServerEnv,
  {
    BetterAuthUrl: Redacted.Redacted<string>;
    BetterAuthSecret: Redacted.Redacted<string>;

    DatabaseUrl: Redacted.Redacted<string>;

    GoogleApiKey: Redacted.Redacted<string>;
    GoogleClientId: Redacted.Redacted<string>;
    GoogleClientSecret: Redacted.Redacted<string>;

    PgPort: Redacted.Redacted<number>;
  }
>()("@gok/env/ServerEnv") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const BetterAuthUrl = yield* Config.redacted("BETTER_AUTH_URL").pipe(Effect.orDie);
      const BetterAuthSecret = yield* Config.redacted("BETTER_AUTH_SECRET").pipe(Effect.orDie);

      const GoogleApiKey = yield* Config.redacted("GOOGLE_API_KEY").pipe(Effect.orDie);
      const GoogleClientId = yield* Config.redacted("GOOGLE_CLIENT_ID").pipe(Effect.orDie);
      const GoogleClientSecret = yield* Config.redacted("GOOGLE_CLIENT_SECRET").pipe(Effect.orDie);

      const DatabaseUrl = yield* Config.redacted("DATABASE_URL").pipe(Effect.orDie);

      const PgPort = yield* Config.schema(Schema.Redacted(Schema.Number), "PGPORT").pipe(
        Effect.orDie,
      );

      return {
        BetterAuthUrl,
        BetterAuthSecret,
        DatabaseUrl,
        GoogleApiKey,
        GoogleClientId,
        GoogleClientSecret,
        PgPort,
      };
    }),
  );
}

export const LocalServerEnv = ConfigProvider.layerAdd(
  ConfigProvider.fromDotEnv({
    path: ".env.local",
    expandVariables: true,
  }),
  { asPrimary: true },
).pipe(Layer.orDie, Layer.provide(NodeFileSystem.layer));

export const ServerEnvLive = Match.value(process.env.RAILWAY_ENVIRONMENT_NAME).pipe(
  Match.when("production", () => ServerEnv.layer),
  Match.when("development", () => ServerEnv.layer.pipe(Layer.provide(LocalServerEnv))),
  Match.orElseAbsurd,
);
