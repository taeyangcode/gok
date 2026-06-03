import { Context, Effect, Option, Schema } from "effect";

import { AudioId, AudioSelect, type AudioSourceId, AudioStorageKey } from "#/db/schema/audios";
import type { YoutubeAudioResult } from "#/services/audio/youtube-audio";

type AudioDbService = {
  readonly findBySourceId: (id: AudioSourceId) => Effect.Effect<Option.Option<AudioSelect>>;
  readonly register: (info: YoutubeAudioResult) => Effect.Effect<AudioSelect>;

  readonly claimDownload: (
    id: AudioId,
  ) => Effect.Effect<AudioSelect, AudioDbLocked | AudioDbMissing | AudioDbReady>;

  readonly markReady: (
    id: AudioId,
    storageKey: AudioStorageKey,
    fileSizeBytes: number,
    mimeType: string,
  ) => Effect.Effect<AudioSelect, AudioDbMissing>;
  readonly delete: (id: AudioId) => Effect.Effect<void, AudioDbMissing>;
};

export class AudioDb extends Context.Service<AudioDb, AudioDbService>()(
  "@gok/services/audio-db/AudioDb",
) {}

export class AudioDbMissing extends Schema.TaggedErrorClass<AudioDbMissing>(
  "@gok/services/audio/audio-db/AudioDbMissing",
)("AudioDbMissing", {}) {}

export class AudioDbLocked extends Schema.TaggedErrorClass<AudioDbLocked>(
  "@gok/services/audio/audio-db/AudioDbLocked",
)("AudioDbLocked", {
  audio: AudioSelect,
}) {}

export class AudioDbReady extends Schema.TaggedErrorClass<AudioDbReady>(
  "@gok/services/audio/audio-db/AudioDbReady",
)("AudioDbReady", {
  audio: AudioSelect,
}) {}
