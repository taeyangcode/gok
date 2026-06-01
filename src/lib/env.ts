import { NodeFileSystem } from "@effect/platform-node";
import { Config, Context, Effect, Layer, Match, Schema } from "effect";
import { ConfigProvider } from "effect";
import { Redacted } from "effect";

export class ServerEnv extends Context.Service<
  ServerEnv,
  {
    BetterAuthUrl: Redacted.Redacted<string>;
    BetterAuthSecret: Redacted.Redacted<string>;

    CloudflareAccessKeyId: Redacted.Redacted<string>;
    CloudflareAccountId: Redacted.Redacted<string>;
    CloudflareApiToken: Redacted.Redacted<string>;
    CloudflareSecretAccessKey: Redacted.Redacted<string>;

    DatabaseUrl: Redacted.Redacted<string>;

    GoogleApiKey: Redacted.Redacted<string>;
    GoogleClientId: Redacted.Redacted<string>;
    GoogleClientSecret: Redacted.Redacted<string>;

    HoneycombApiKey: Redacted.Redacted<string>;

    PgPort: Redacted.Redacted<number>;

    RailwayEnvironmentName: Redacted.Redacted<string>;
    RailwayServiceName: Redacted.Redacted<string>;
  }
>()("@gok/env/ServerEnv") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const BetterAuthUrl = yield* Config.redacted("BETTER_AUTH_URL").pipe(Effect.orDie);
      const BetterAuthSecret = yield* Config.redacted("BETTER_AUTH_SECRET").pipe(Effect.orDie);

      const CloudflareAccessKeyId = yield* Config.redacted("CLOUDFLARE_ACCESS_KEY_ID").pipe(
        Effect.orDie,
      );
      const CloudflareAccountId = yield* Config.redacted("CLOUDFLARE_ACCOUNT_ID").pipe(
        Effect.orDie,
      );
      const CloudflareApiToken = yield* Config.redacted("CLOUDFLARE_API_TOKEN").pipe(Effect.orDie);
      const CloudflareSecretAccessKey = yield* Config.redacted("CLOUDFLARE_SECRET_ACCESS_KEY").pipe(
        Effect.orDie,
      );

      const DatabaseUrl = yield* Config.redacted("DATABASE_URL").pipe(Effect.orDie);

      const GoogleApiKey = yield* Config.redacted("GOOGLE_API_KEY").pipe(Effect.orDie);
      const GoogleClientId = yield* Config.redacted("GOOGLE_CLIENT_ID").pipe(Effect.orDie);
      const GoogleClientSecret = yield* Config.redacted("GOOGLE_CLIENT_SECRET").pipe(Effect.orDie);

      const HoneycombApiKey = yield* Config.redacted("HONEYCOMB_API_KEY").pipe(Effect.orDie);

      const PgPort = yield* Config.schema(Schema.Redacted(Schema.Number), "PGPORT").pipe(
        Effect.orDie,
      );

      const RailwayEnvironmentName = yield* Config.redacted("RAILWAY_ENVIRONMENT_NAME").pipe(
        Effect.orDie,
      );
      const RailwayServiceName = yield* Config.redacted("RAILWAY_SERVICE_NAME").pipe(Effect.orDie);

      return {
        BetterAuthUrl,
        BetterAuthSecret,

        CloudflareAccessKeyId,
        CloudflareAccountId,
        CloudflareApiToken,
        CloudflareSecretAccessKey,

        DatabaseUrl,

        GoogleApiKey,
        GoogleClientId,
        GoogleClientSecret,

        HoneycombApiKey,

        PgPort,

        RailwayEnvironmentName,
        RailwayServiceName,
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
  Match.orElse(() => ServerEnv.layer.pipe(Layer.provide(LocalServerEnv))),
);
