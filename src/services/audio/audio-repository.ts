import { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Cause, Context, Effect, Layer, Option, Schema } from "effect";
import { Activity, Workflow } from "effect/unstable/workflow";

import { AudioId, AudioSelect, AudioSourceId } from "#/db/schema/audios";
import { ServerEnvLive } from "#/lib/env";
import { R2Client } from "#/lib/r2";
import { WorkflowEngineLayer } from "#/lib/workflow";
import { YtdlpClient } from "#/lib/ytdlp";
import { AudioDb, AudioDbLocked, AudioDbMissing, AudioDbReady } from "#/services/audio/audio-db";
import {
  AudioObjectMissing,
  AudioStorage,
  ObjectUploadResponse,
} from "#/services/audio/audio-storage";
import { AudioOnlyError, CouldNotFindAudio, YoutubeAudio } from "#/services/audio/youtube-audio";

type AudioRepositoryService = {
  readonly ensureDownloaded: (
    sourceId: AudioSourceId,
  ) => Effect.Effect<
    void,
    | AudioOnlyError
    | AudioDbLocked
    | AudioDbMissing
    | AudioDbReady
    | AudioObjectMissing
    | CouldNotFindAudio
    | EffectDrizzleQueryError
  >;
};

export class AudioRepository extends Context.Service<AudioRepository, AudioRepositoryService>()(
  "@gok/services/audio/AudioRepository",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const workflowLayer = Layer.mergeAll(EnsureAudioDownloaded).pipe(
        Layer.provideMerge(WorkflowEngineLayer),
      );

      return {
        ensureDownloaded: Effect.fn(function* (sourceId) {
          return yield* EnsureAudioDownloadedWorkflow.execute({ sourceId }).pipe(
            Effect.provide(workflowLayer),
            Effect.orDie,
          );
        }),
      };
    }),
  );
}

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
).pipe(
  Layer.provide([AudioDb.layer, YoutubeAudio.layer, AudioStorage.layer]),
  Layer.provide([YtdlpClient.layer, R2Client.layer]),
  Layer.provide(ServerEnvLive),
);
