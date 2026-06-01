import { S3Client } from "@aws-sdk/client-s3";
import { Context, Effect, Layer, Redacted } from "effect";

import { ServerEnv } from "#/lib/env";

export class R2Client extends Context.Service<R2Client, S3Client>()("@gok/r2/R2Client") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { CloudflareAccessKeyId, CloudflareAccountId, CloudflareSecretAccessKey } =
        yield* ServerEnv;

      const client = new S3Client({
        endpoint: `https://${Redacted.value(CloudflareAccountId)}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: Redacted.value(CloudflareAccessKeyId),
          secretAccessKey: Redacted.value(CloudflareSecretAccessKey),
        },
      });
      return client;
    }),
  );
}
