import { Context, Effect, Layer, Schema, Struct } from "effect";

import { AudioSelect, type AudioSourceId } from "#/db/schema/audios";
import { YtdlpClient } from "#/lib/ytdlp";
import { youtubeUrlFromId } from "#/utils/youtube";

type YoutubeAudioService = {
  findInfo: (
    sourceId: AudioSourceId,
  ) => Effect.Effect<YoutubeAudioResult, AudioOnlyError | CouldNotFindAudio>;
  download: (sourceId: AudioSourceId) => Effect.Effect<File, CouldNotFindAudio>;
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
            catch: (error) => new CouldNotFindAudio(),
          });

          if (info._type === "video") {
            return YoutubeAudioResult.make({
              title: info.title,
              artist: info.uploader,
              durationSeconds: info.duration,

              sourceType: "youtube",
              sourceId: sourceId,
              sourceUrl: info.url,
              thumbnailUrl: info.thumbnail,
            });
          }

          return yield* new AudioOnlyError();
        }),
        download: Effect.fn(function* (sourceId) {
          const file = yield* Effect.tryPromise({
            try: () =>
              youtubeClient.getFileAsync(youtubeUrlFromId(sourceId), {
                audioFormat: "mp3",
                format: {
                  filter: "audioonly",
                  type: "mp3",
                },
              }),
            catch: (error) => new CouldNotFindAudio(),
          });

          return file;
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

export class CouldNotFindAudio extends Schema.TaggedErrorClass<CouldNotFindAudio>(
  "@gok/services/audio/youtube-audio/CouldNotFindAudio",
)("CouldNotFindAudio", {}) {}

export class AudioOnlyError extends Schema.TaggedErrorClass<AudioOnlyError>(
  "@gok/services/audio/youtube-audio/AudioOnlyError",
)("AudioOnlyError", {}) {}
