import { Context, Effect, Schema } from "effect";
import { Activity } from "effect/unstable/workflow";

import { AudioSelect, AudioSourceId } from "#/db/schema/audios";

type AudioStorageService = {
  readonly exists: (id: AudioSourceId) => Effect.Effect<AudioSelect>;
  readonly upload: (path: string) => Effect.Effect<void>;
};

export class AudioStorage extends Context.Service<AudioStorage, AudioStorageService>()(
  "@gok/audio-storage/AudioStorage",
) {}
