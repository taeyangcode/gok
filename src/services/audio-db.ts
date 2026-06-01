import { Context, Effect, Option, Schema } from "effect";

import { AudioId, AudioSelect, type AudioSourceId, AudioStorageKey } from "#/db/schema/audios";

export class AudioMissing extends Schema.ErrorClass<AudioMissing>(
  "@gok/services/audio-db/AudioMissing",
)({}) {}

export class AudioLocked extends Schema.ErrorClass<AudioLocked>(
  "@gok/services/audio-db/AudioLocked",
)({
  audio: AudioSelect,
}) {}

export class AudioReady extends Schema.ErrorClass<AudioReady>("@gok/services/audio-db/AudioReady")({
  audio: AudioSelect,
}) {}

type AudioDbService = {
  readonly find: (id: AudioSourceId) => Effect.Effect<Option.Option<AudioSelect>>;
  readonly claimDownload: (
    id: AudioId,
  ) => Effect.Effect<AudioSelect, AudioLocked | AudioMissing | AudioReady>;
  readonly markReady: (
    id: AudioId,
    storageKey: AudioStorageKey,
    fileSizeBytes: number,
    mimeType: string,
  ) => Effect.Effect<AudioSelect, AudioMissing>;
};

export class AudioDb extends Context.Service<AudioDb, AudioDbService>()("@gok/audio-db/AudioDb") {}
