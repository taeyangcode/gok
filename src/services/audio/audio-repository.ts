import { Context, Effect, Layer, Option, Schema } from "effect";
import { Activity, Workflow } from "effect/unstable/workflow";

import { AudioSelect, AudioSourceId } from "#/db/schema/audios";
import { AudioDb, AudioDbLocked, AudioDbMissing, AudioDbReady } from "#/services/audio/audio-db";
import {
  AudioObjectMissing,
  AudioStorage,
  R2ObjectUploadResponse,
} from "#/services/audio/audio-storage";
import { YoutubeAudio, YoutubeAudioDoesNotExist } from "#/services/audio/youtube-audio";

type AudioRepositoryService = {
  readonly ensureDownloaded: (sourceId: AudioSourceId) => Effect.Effect<unknown>;
};

export class AudioRepository extends Context.Service<AudioRepository, AudioRepositoryService>()(
  "@gok/services/audio/AudioRepository",
) {}

const EnsureAudioDownloadedWorkflow = Workflow.make({
  name: "EnsureAudioDownloaded",
  error: Schema.Void,
  success: Schema.Void,
  payload: Schema.Struct({
    sourceId: AudioSourceId,
  }),
  idempotencyKey: (payload) => payload.sourceId,
});

const EnsureAudioDownloaded = EnsureAudioDownloadedWorkflow.toLayer(
  Effect.fn(function* (payload, executionId) {
    const youtube = yield* YoutubeAudio;
    const audioDb = yield* AudioDb;
    const audioStorage = yield* AudioStorage;

    const audioRecord = yield* Activity.make({
      name: "GetOrRegisterAudioToDb",
      error: YoutubeAudioDoesNotExist,
      success: AudioSelect,
      execute: Effect.gen(function* () {
        const audioRecord = yield* audioDb.findBySourceId(payload.sourceId);

        if (Option.isSome(audioRecord)) {
          return audioRecord.value;
        }

        const audioInfo = yield* youtube.findInfo(payload.sourceId);
        return yield* audioDb.register(audioInfo);
      }),
    });

    const claimedAudio = yield* Activity.make({
      name: "ClaimAudioDownload",
      error: Schema.Union([AudioDbLocked, AudioDbMissing, AudioDbReady]),
      success: Schema.Void,
      execute: Effect.gen(function* () {
        return yield* audioDb.claimDownload(audioRecord.id);
      }),
    });

    const audioFile = yield* Activity.make({
      name: "DownloadAudio",
      error: YoutubeAudioDoesNotExist,
      success: Schema.File,
      execute: Effect.gen(function* () {
        const file = yield* youtube.download(payload.sourceId);
        return file;
      }),
    });

    const audioStorageKey = yield* audioStorage.createStorageKey(audioRecord.id);

    yield* Activity.make({
      name: "UploadAudioToStorage",
      error: Schema.Never,
      success: R2ObjectUploadResponse,
      execute: Effect.gen(function* () {
        return yield* audioStorage.upload(audioStorageKey, audioFile);
      }),
    });

    yield* Activity.make({
      name: "MarkAudioReady",
      error: AudioDbMissing,
      success: Schema.Void,
      execute: Effect.gen(function* () {
        return yield* audioDb.markReady(
          audioRecord.id,
          audioStorageKey,
          audioFile.size,
          audioFile.type,
        );
      }),
    });
  }),
);
