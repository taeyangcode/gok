import { youtube, youtube_v3 } from "@googleapis/youtube";
import { Context, Effect, Layer, Redacted } from "effect";

import { ServerEnv } from "#/lib/env";

export class GoogleClient extends Context.Service<GoogleClient, { client: youtube_v3.Youtube }>()(
  "@gok/google/GoogleClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { GoogleApiKey } = yield* ServerEnv;

      const client = youtube({
        version: "v3",
        auth: Redacted.value(GoogleApiKey),
      });

      return { client: client };
    }),
  );
}
