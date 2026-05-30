import { Layer, ManagedRuntime } from "effect";

import { PgClientLive } from "#/db";
import { PgPool, ServerAuth } from "#/lib/auth";
import { ServerEnvLive } from "#/lib/env";

const DatabaseLive = PgClientLive;
const ServerAuthLive = ServerAuth.layer.pipe(Layer.provide(PgPool.layer));

export const Runtime = ManagedRuntime.make(
  Layer.mergeAll(DatabaseLive, ServerAuthLive).pipe(Layer.provide(ServerEnvLive)),
);
