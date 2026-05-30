import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { OtlpSerialization } from "effect/unstable/observability";

import { PgClientLive } from "#/db";
import { PgPool, ServerAuth } from "#/lib/auth";
import { ServerEnvLive } from "#/lib/env";
import { ObservabilityLayer } from "#/lib/otel";

const DatabaseLive = PgClientLive;
const ServerAuthLive = ServerAuth.layer.pipe(Layer.provide(PgPool.layer));

const ObservabilityLive = ObservabilityLayer;

export const Runtime = ManagedRuntime.make(
  Layer.mergeAll(DatabaseLive, ServerAuthLive, ObservabilityLive).pipe(
    Layer.provide(OtlpSerialization.layerJson),
    Layer.provide(FetchHttpClient.layer),
    Layer.provide(ServerEnvLive),
  ),
);
