import { Context, Effect, Layer } from "effect";
import { YtDlp } from "ytdlp-nodejs";

export class YtdlpClient extends Context.Service<YtdlpClient, YtDlp>()("@gok/lib/ytdlp/Ytdlp") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const client = new YtDlp({ binaryPath: "./ytdlp" });
      const ffmpegInstalled = client.checkInstallation();
      if (!ffmpegInstalled) {
        yield* Effect.promise(() => client.downloadFFmpeg());
      }
      return client;
    }),
  );
}
