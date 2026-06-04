import { createReadStream } from "node:fs";

import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Context, Effect, FileSystem, Layer, Redacted, Schema } from "effect";

import { AudioId, AudioStorageKey } from "#/db/schema/audios";
import { ServerEnv } from "#/lib/env";
import { R2Client } from "#/lib/r2";

type AudioStorageService = {
  readonly find: (storageKey: AudioStorageKey) => Effect.Effect<ObjectHeadResponse>;
  readonly createStorageKey: (audioId: AudioId) => Effect.Effect<AudioStorageKey>;
  readonly upload: (
    storageKey: AudioStorageKey,
    filePath: string,
  ) => Effect.Effect<ObjectUploadResponse, AudioUploadError>;
  readonly createSignedUrl: (storageKey: AudioStorageKey) => Effect.Effect<AudioSignedUrl>;
};

export class AudioStorage extends Context.Service<AudioStorage, AudioStorageService>()(
  "@gok/services/audio/audio-storage/AudioStorage",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const storageClient = yield* R2Client;
      const fs = yield* FileSystem.FileSystem;
      const { CloudflareR2AudioBucketName } = yield* ServerEnv;
      const bucket = Redacted.value(CloudflareR2AudioBucketName);
      yield* Effect.log({ bucket });

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
        upload: Effect.fn(function* (storageKey, filePath) {
          const info = yield* fs
            .stat(filePath)
            .pipe(Effect.mapError((error) => AudioUploadError.make({ error: error.message })));

          const audio = yield* Effect.tryPromise({
            try: () =>
              storageClient.send(
                new PutObjectCommand({
                  Bucket: bucket,
                  Key: storageKey,
                  Body: createReadStream(filePath),
                  ContentType: info.type,
                  ContentLength: Number(info.size),
                }),
              ),
            catch: (error) => AudioUploadError.make({ error: error?.message ?? String(error) }),
          });

          return ObjectUploadResponse.make({
            key: storageKey,
            etag: audio.ETag,
            contentType: info.type,
            contentLength: Number(info.size),
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
  contentType: Schema.String,
  contentLength: Schema.Number,
}) {}

export class AudioUploadError extends Schema.TaggedErrorClass<AudioUploadError>(
  "@gok/services/audio/audio-storage/AudioUploadError",
)("AudioUploadError", {
  error: Schema.optional(Schema.String),
}) {}

export const AudioSignedUrl = Schema.brand("AudioSignedUrl")(Schema.String);
export type AudioSignedUrl = typeof AudioSignedUrl.Type;

export class AudioObjectMissing extends Schema.TaggedErrorClass<AudioObjectMissing>(
  "@gok/services/audio/audio-storage/AudioObjectMissing",
)("AudioObjectMissing", {}) {}
