import { Layer, ManagedRuntime } from "effect";

import { PgClientLive } from "#/db";
import { PgPool, ServerAuth } from "#/lib/auth";
import { EnvironmentLive, ServerEnv } from "#/lib/env";

const EnvLive = ServerEnv.layer.pipe(Layer.provide(EnvironmentLive));

const DatabaseLive = PgClientLive;
const ServerAuthLive = ServerAuth.layer.pipe(Layer.provide(PgPool.layer));

export const Runtime = ManagedRuntime.make(
  Layer.mergeAll(DatabaseLive, ServerAuthLive).pipe(Layer.provide(EnvLive)),
);
