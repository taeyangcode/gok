import { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Cause, Context, Effect, Option, Schema } from "effect";
import { Activity, Workflow } from "effect/unstable/workflow";

import { AudioId, AudioSelect, AudioSourceId } from "#/db/schema/audios";
import { AudioDb, AudioDbLocked, AudioDbMissing, AudioDbReady } from "#/services/audio/audio-db";
import {
  AudioObjectMissing,
  AudioStorage,
  ObjectUploadResponse,
} from "#/services/audio/audio-storage";
import { AudioOnlyError, CouldNotFindAudio, YoutubeAudio } from "#/services/audio/youtube-audio";

type AudioRepositoryService = {
  readonly ensureDownloaded: (sourceId: AudioSourceId) => Effect.Effect<unknown>;
};

export class AudioRepository extends Context.Service<AudioRepository, AudioRepositoryService>()(
  "@gok/services/audio/AudioRepository",
) {}

const EnsureAudioDownloadedWorkflow = Workflow.make({
  name: "EnsureAudioDownloaded",
  error: Schema.Union([
    AudioOnlyError,
    AudioDbLocked,
    AudioDbMissing,
    AudioDbReady,
    AudioObjectMissing,
    CouldNotFindAudio,
    EffectDrizzleQueryError,
  ]),
  success: Schema.Void,
  payload: Schema.Struct({
    sourceId: AudioSourceId,
  }),
  idempotencyKey: (payload) => payload.sourceId,
});

const EnsureAudioDownloaded = EnsureAudioDownloadedWorkflow.toLayer(
  Effect.fn(function* (payload, _executionId) {
    const youtube = yield* YoutubeAudio;
    const audioDb = yield* AudioDb;
    const audioStorage = yield* AudioStorage;

    const audioRecord = yield* Activity.make({
      name: "GetOrRegisterAudioToDb",
      error: Schema.Union([EffectDrizzleQueryError, AudioOnlyError, CouldNotFindAudio]),
      success: AudioSelect,
      execute: Effect.gen(function* () {
        const audioRecord = yield* audioDb.findBySourceId(payload.sourceId);

        if (Option.isSome(audioRecord)) {
          return audioRecord.value;
        }

        const audioInfo = yield* youtube.findInfo(payload.sourceId);
        return yield* audioDb.ensureRegistered({
          id: AudioId.make(crypto.randomUUID()),
          downloadStatus: "registered",
          ...audioInfo,
        });
      }),
    }).pipe(
      Effect.catchTags({
        AudioOnlyError: (audioOnlyError) => Effect.fail(audioOnlyError),
        CouldNotFindAudio: (couldNotFindAudio) => Effect.fail(couldNotFindAudio),
      }),
    );

    const claimedAudio = yield* Activity.make({
      name: "ClaimAudioDownload",
      error: Schema.Union([AudioDbLocked, AudioDbMissing, AudioDbReady, EffectDrizzleQueryError]),
      success: AudioSelect,
      execute: Effect.gen(function* () {
        return yield* audioDb.claimDownload(audioRecord.id);
      }),
    }).pipe(
      Effect.catchTags({
        AudioDbLocked: (audioLocked) => Effect.succeed(audioLocked.audio),
        AudioDbMissing: (audioMissing) => Effect.fail(audioMissing),
        AudioDbReady: (audioReady) => Effect.succeed(audioReady.audio),
      }),
    );

    if (claimedAudio.downloadStatus !== "downloading") {
      return claimedAudio;
    }

    yield* Effect.gen(function* () {
      const audioFile = yield* Activity.make({
        name: "DownloadAudio",
        error: Schema.Union([AudioOnlyError, CouldNotFindAudio]),
        success: Schema.File,
        execute: Effect.gen(function* () {
          return yield* youtube.download(payload.sourceId);
        }),
      });

      const audioStorageKey = yield* audioStorage.createStorageKey(claimedAudio.id);

      yield* Activity.make({
        name: "UploadAudioToStorage",
        error: Schema.Never,
        success: ObjectUploadResponse,
        execute: Effect.gen(function* () {
          return yield* audioStorage.upload(audioStorageKey, audioFile);
        }),
      });

      yield* Activity.make({
        name: "MarkAudioReady",
        error: Schema.Union([AudioDbMissing, EffectDrizzleQueryError]),
        success: Schema.Void,
        execute: Effect.gen(function* () {
          return yield* audioDb.markReady(
            claimedAudio.id,
            audioStorageKey,
            audioFile.size,
            audioFile.type,
          );
        }),
      });
    }).pipe(
      EnsureAudioDownloadedWorkflow.withCompensation(
        Effect.fn(function* (value, cause) {
          if (!Cause.hasInterruptsOnly(cause)) {
            const error = Cause.findErrorOption(cause);
            if (Option.isSome(error)) {
              yield* audioDb.delete(claimedAudio.id).pipe(Effect.orElseSucceed(() => void 0));
            }
          }
        }),
      ),
    );
  }),
);
