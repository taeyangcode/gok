import { Context, Effect, Layer } from "effect";
import type { DownloadResult } from "ytdlp-nodejs";

import { YtdlpClient } from "#/lib/ytdlp";

type AudioService = {
  readonly download: (url: string) => Effect.Effect<DownloadResult>;
};

export class Audio extends Context.Service<Audio, AudioService>()("@gok/audio/Audio") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const ytdlp = yield* YtdlpClient;
    }),
  );
}
