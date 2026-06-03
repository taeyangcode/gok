import { Context, Effect, Schema, Struct } from "effect";

import { AudioSelect, type AudioSourceId } from "#/db/schema/audios";

type YoutubeAudioService = {
  findInfo: (
    sourceId: AudioSourceId,
  ) => Effect.Effect<YoutubeAudioResult, YoutubeAudioDoesNotExist>;
  download: (sourceId: AudioSourceId) => Effect.Effect<File, YoutubeAudioDoesNotExist>;
  list: (query: string) => Effect.Effect<YoutubeAudioResult[]>;
};

export class YoutubeAudio extends Context.Service<YoutubeAudio, YoutubeAudioService>()(
  "@gok/services/audio/audio-query/YoutubeAudio",
) {}

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

export class YoutubeAudioDoesNotExist extends Schema.TaggedErrorClass<YoutubeAudioDoesNotExist>(
  "@gok/services/audio/youtube-audio/YoutubeAudioDoesNotExist",
)("YoutubeAudioDoesNotExist", {}) {}
