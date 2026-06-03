import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Context, Effect, Layer, Redacted, Schema } from "effect";

import { AudioId, AudioStorageKey } from "#/db/schema/audios";
import { ServerEnv } from "#/lib/env";
import { R2Client } from "#/lib/r2";

type AudioStorageService = {
  readonly find: (storageKey: AudioStorageKey) => Effect.Effect<ObjectHeadResponse>;
  readonly createStorageKey: (audioId: AudioId) => Effect.Effect<AudioStorageKey>;
  readonly upload: (storageKey: AudioStorageKey, file: File) => Effect.Effect<ObjectUploadResponse>;
  readonly createSignedUrl: (storageKey: AudioStorageKey) => Effect.Effect<AudioSignedUrl>;
};

export class AudioStorage extends Context.Service<AudioStorage, AudioStorageService>()(
  "@gok/services/audio/audio-storage/AudioStorage",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const storageClient = yield* R2Client;
      const { CloudflareR2AudioBucketName } = yield* ServerEnv;
      const bucket = Redacted.value(CloudflareR2AudioBucketName);

      return {
        find: Effect.fn(function* (storageKey) {
          const audio = yield* Effect.tryPromise(() =>
            storageClient.send(
              new HeadObjectCommand({
                Bucket: bucket,
                Key: storageKey,
              }),
            ),
          ).pipe(Effect.orDie);

          return ObjectHeadResponse.make({
            key: storageKey,
            etag: audio.ETag,
            contentType: audio.ContentType,
            contentLength: audio.ContentLength,
            lastModified: audio.LastModified,
          });
        }),
        createStorageKey: Effect.fn(function* (audioId) {
          return yield* Effect.succeed(AudioStorageKey.make(`audio/${audioId}`));
        }),
        upload: Effect.fn(function* (storageKey, file) {
          const buffer = yield* Effect.promise(() => file.arrayBuffer());
          const body = new Uint8Array(buffer);

          const audio = yield* Effect.tryPromise(() =>
            storageClient.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: storageKey,
                Body: body,
                ContentType: file.type,
                ContentLength: file.size,
              }),
            ),
          ).pipe(Effect.orDie);

          return ObjectUploadResponse.make({
            key: storageKey,
            etag: audio.ETag,
          });
        }),
        createSignedUrl: Effect.fn(function* (storageKey) {
          const url = yield* Effect.tryPromise(() =>
            getSignedUrl(
              storageClient,
              new GetObjectCommand({
                Bucket: bucket,
                Key: storageKey,
              }),
              {
                expiresIn: 60 * 10,
              },
            ),
          ).pipe(Effect.orDie);

          return AudioSignedUrl.make(url);
        }),
      };
    }),
  );
}

export class ObjectHeadResponse extends Schema.Class<ObjectHeadResponse>(
  "@gok/services/audio/audio-storage/ObjectHeadResponse",
)({
  key: AudioStorageKey,
  etag: Schema.optionalKey(Schema.String),
  contentType: Schema.optionalKey(Schema.String),
  contentLength: Schema.optionalKey(Schema.Number),
  lastModified: Schema.optionalKey(Schema.Date),
}) {}

export class ObjectUploadResponse extends Schema.Class<ObjectUploadResponse>(
  "@gok/services/audio/audio-storage/ObjectUploadResponse",
)({
  key: AudioStorageKey,
  etag: Schema.optionalKey(Schema.String),
}) {}

export const AudioSignedUrl = Schema.brand("AudioSignedUrl")(Schema.String);
export type AudioSignedUrl = typeof AudioSignedUrl.Type;

export class AudioObjectMissing extends Schema.TaggedErrorClass<AudioObjectMissing>(
  "@gok/services/audio/audio-storage/AudioObjectMissing",
)("AudioObjectMissing", {}) {}
