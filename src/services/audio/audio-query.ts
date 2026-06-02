import { Context, Effect, Struct } from "effect";

import { AudioSelect, type AudioSourceId } from "#/db/schema/audios";

const AudioQueryResult = AudioSelect.mapFields(
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
type AudioQueryResult = typeof AudioQueryResult.Type;

type AudioQueryService = {
  find: (sourceId: AudioSourceId) => Effect.Effect<AudioQueryResult>;
  list: (query: string) => Effect.Effect<AudioQueryResult[]>;
};

export class AudioQuery extends Context.Service<AudioQuery, AudioQueryService>()(
  "@gok/services/audio/audio-query/AudioQuery",
) {
  // static readonly youtubeLayer = Layer.effect(
  //   this,
  //   Effect.gen(function* () {}),
  // );
}
