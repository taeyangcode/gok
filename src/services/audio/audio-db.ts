import { eq } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer, Option, Schema } from "effect";

import { DrizzleDb } from "#/db";
import {
  AudioId,
  AudioInsert,
  audios,
  AudioSelect,
  type AudioSourceId,
  AudioStorageKey,
} from "#/db/schema/audios";

type AudioDbService = {
  readonly findBySourceId: (
    sourceId: AudioSourceId,
  ) => Effect.Effect<Option.Option<AudioSelect>, EffectDrizzleQueryError>;
  readonly ensureRegistered: (
    info: AudioInsert,
  ) => Effect.Effect<AudioSelect, EffectDrizzleQueryError>;

  readonly claimDownload: (
    audioId: AudioId,
  ) => Effect.Effect<
    AudioSelect,
    AudioDbLocked | AudioDbMissing | AudioDbReady | EffectDrizzleQueryError
  >;

  readonly markReady: (
    audioId: AudioId,
    storageKey: AudioStorageKey,
    fileSizeBytes: number,
    mimeType: string,
  ) => Effect.Effect<AudioSelect, AudioDbMissing | EffectDrizzleQueryError>;
  readonly delete: (id: AudioId) => Effect.Effect<void, AudioDbMissing | EffectDrizzleQueryError>;
};

export class AudioDb extends Context.Service<AudioDb, AudioDbService>()(
  "@gok/services/audio-db/AudioDb",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const db = yield* DrizzleDb;

      return {
        findBySourceId: Effect.fn(function* (sourceId) {
          const [record] = yield* db
            .select()
            .from(audios)
            .where(eq(audios.sourceId, sourceId))
            .limit(1);
          return Option.fromUndefinedOr(record).pipe(
            Option.andThen(Schema.decodeUnknownOption(AudioSelect)),
          );
        }),
        ensureRegistered: Effect.fn(function* (info) {
          const [insertedRecord] = yield* db
            .insert(audios)
            .values(info)
            .onConflictDoNothing({ target: [audios.sourceId, audios.sourceType] })
            .returning();

          if (insertedRecord !== undefined) {
            return Schema.decodeUnknownSync(AudioSelect)(insertedRecord);
          }

          const [record] = yield* db
            .select()
            .from(audios)
            .where(eq(audios.sourceId, info.sourceId))
            .limit(1);
          return Schema.decodeUnknownSync(AudioSelect)(record);
        }),
        claimDownload: Effect.fn(function* (id) {
          const [record] = yield* db
            .update(audios)
            .set({ downloadStatus: "downloading" })
            .where(eq(audios.id, id))
            .returning();
          return Schema.decodeUnknownSync(AudioSelect)(record);
        }),
        markReady: Effect.fn(function* (id, storageKey, fileSizeBytes, mimeType) {
          const [record] = yield* db
            .update(audios)
            .set({ downloadStatus: "ready", storageKey, fileSizeBytes, mimeType })
            .where(eq(audios.id, id))
            .returning();
          return Schema.decodeUnknownSync(AudioSelect)(record);
        }),
        delete: Effect.fn(function* (id) {
          return yield* db.delete(audios).where(eq(audios.id, id));
        }),
      };
    }),
  );
}

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
