import { Context, Effect, Layer, Schema, Struct } from "effect";

import { AudioSelect, type AudioSourceId } from "#/db/schema/audios";
import { YtdlpClient } from "#/lib/ytdlp";
import { youtubeUrlFromId } from "#/utils/youtube";

type YoutubeAudioService = {
  findInfo: (
    sourceId: AudioSourceId,
  ) => Effect.Effect<YoutubeAudioResult, AudioOnlyError | CouldNotFindAudio>;
  download: (sourceId: AudioSourceId) => Effect.Effect<DownloadedAudioFile, CouldNotFindAudio>;
  // list: (query: string) => Effect.Effect<YoutubeAudioResult[]>;
};

export class YoutubeAudio extends Context.Service<YoutubeAudio, YoutubeAudioService>()(
  "@gok/services/audio/audio-query/YoutubeAudio",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const youtubeClient = yield* YtdlpClient;

      return {
        findInfo: Effect.fn(function* (sourceId) {
          const info = yield* Effect.tryPromise({
            try: () =>
              youtubeClient.getInfoAsync(youtubeUrlFromId(sourceId), { flatPlaylist: true }),
            catch: (error) => new CouldNotFindAudio({ error: error }),
          });

          if (info._type === "video") {
            return YoutubeAudioResult.make({
              title: info.title ?? "Unknown title",
              artist: info.uploader ?? null,
              durationSeconds: info.duration ?? null,

              sourceType: "youtube",
              sourceId: sourceId,
              sourceUrl: info.webpage_url ?? youtubeUrlFromId(sourceId),
              thumbnailUrl: info.thumbnail ?? null,
            });
          }

          return yield* new AudioOnlyError();
        }),
        download: Effect.fn(function* (sourceId) {
          const result = yield* Effect.tryPromise({
            try: () =>
              youtubeClient.downloadAudio(youtubeUrlFromId(sourceId), "mp3", {
                noPlaylist: true,
                output: `./tmp/audio/${sourceId}.%(ext)s`,
              }),
            catch: (error) => new CouldNotFindAudio({ error: error }),
          });

          const [path] = result.filePaths;
          if (path === undefined) {
            return yield* new CouldNotFindAudio();
          }
          return DownloadedAudioFile.make({ path, contentType: "audio/mpeg" });
        }),
      };
    }),
  );
}

export const YoutubeAudioResult = AudioSelect.mapFields(
  Struct.pick([
    "title",
    "artist",
    "durationSeconds",

    "sourceType",
    "sourceId",
    "sourceUrl",
    "thumbnailUrl",
  ]),
);
export type YoutubeAudioResult = typeof YoutubeAudioResult.Type;

export const DownloadedAudioFile = Schema.Struct({
  path: Schema.String,
  contentType: Schema.String,
});
export type DownloadedAudioFile = typeof DownloadedAudioFile.Type;

export class CouldNotFindAudio extends Schema.TaggedErrorClass<CouldNotFindAudio>(
  "@gok/services/audio/youtube-audio/CouldNotFindAudio",
)("CouldNotFindAudio", {
  error: Schema.optional(Schema.Unknown),
}) {}

export class AudioOnlyError extends Schema.TaggedErrorClass<AudioOnlyError>(
  "@gok/services/audio/youtube-audio/AudioOnlyError",
)("AudioOnlyError", {}) {}
