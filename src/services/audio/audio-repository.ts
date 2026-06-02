import { Context, Effect, Layer, Option, Schema } from "effect";
import { Activity, Workflow } from "effect/unstable/workflow";

import { AudioSelect, AudioSourceId } from "#/db/schema/audios";
import { AudioDb } from "#/services/audio/audio-db";

type AudioRepositoryService = {
  readonly ensureDownloaded: (sourceId: AudioSourceId) => Effect.Effect<unknown>;
};

export class AudioRepository extends Context.Service<AudioRepository, AudioRepositoryService>()(
  "@gok/services/audio/AudioRepository",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {}),
  );
}

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
    const audioDb = yield* AudioDb;

    const maybeAudioDbRecord = yield* audioDb.find(payload.sourceId);

    const audioDbRecord = yield* Activity.make({
      name: "GetOrRegisterAudio",
      error: Schema.Void,
      success: AudioSelect,
      execute: Effect.gen(function* () {
        if (Option.isSome(maybeAudioDbRecord)) {
          return maybeAudioDbRecord.value;
        }
      }),
    });
  }),
);
