import { Context, Effect, Schema } from "effect";

import { AudioId, AudioStorageKey } from "#/db/schema/audios";

type AudioStorageService = {
  readonly find: (
    storageId: AudioStorageKey,
  ) => Effect.Effect<R2ObjectListResponse, AudioObjectMissing>;
  readonly createStorageKey: (audioId: AudioId) => Effect.Effect<AudioStorageKey>;
  readonly upload: (id: AudioStorageKey, file: File) => Effect.Effect<R2ObjectUploadResponse>;
  readonly signedUrl: (id: AudioStorageKey) => Effect.Effect<AudioSignedUrl, AudioObjectMissing>;
};

export class AudioStorage extends Context.Service<AudioStorage, AudioStorageService>()(
  "@gok/services/audio/audio-storage/AudioStorage",
) {}

// https://developers.cloudflare.com/api/resources/r2#(resource)%20r2.buckets.objects%20%3E%20(model)%20object_list_response%20%3E%20(schema)
export class R2ObjectListResponse extends Schema.Class<R2ObjectListResponse>(
  "@gok/services/audio/audio-storage/R2ObjectListResponse",
)({
  customMetadata: Schema.optionalKey(Schema.Record(Schema.String, Schema.String)),
  etag: Schema.optionalKey(Schema.String),
  httpMetadata: Schema.optionalKey(
    Schema.Struct({
      cacheControl: Schema.optionalKey(Schema.String),
      cacheExpiry: Schema.optionalKey(Schema.String),
      contentDisposition: Schema.optionalKey(Schema.String),
      contentEncoding: Schema.optionalKey(Schema.String),
      contentLanguage: Schema.optionalKey(Schema.String),
      contentType: Schema.optionalKey(Schema.String),
    }),
  ),
  key: Schema.optionalKey(AudioStorageKey),
  lastModified: Schema.optionalKey(Schema.String),
  size: Schema.optionalKey(Schema.Number),
  ssec: Schema.optionalKey(Schema.Boolean),
  storageClass: Schema.optionalKey(Schema.String),
}) {}

// https://developers.cloudflare.com/api/resources/r2#(resource)%20r2.buckets.objects%20%3E%20(model)%20object_upload_response%20%3E%20(schema)
export class R2ObjectUploadResponse extends Schema.Class<R2ObjectUploadResponse>(
  "@gok/services/audio/audio-storage/R2ObjectUploadResponse",
)({
  etag: Schema.optionalKey(Schema.String),
  key: Schema.optionalKey(AudioStorageKey),
  size: Schema.optionalKey(Schema.Number),
  storageClass: Schema.optionalKey(Schema.String),
  uploaded: Schema.optionalKey(Schema.String),
  version: Schema.optionalKey(Schema.String),
}) {}

export const AudioSignedUrl = Schema.brand("AudioSignedUrl")(Schema.String);
export type AudioSignedUrl = typeof AudioSignedUrl.Type;

export class AudioObjectMissing extends Schema.TaggedErrorClass<AudioObjectMissing>(
  "@gok/services/audio/audio-storage/AudioObjectMissing",
)("AudioObjectMissing", {}) {}
