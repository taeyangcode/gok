import { Layer, ManagedRuntime } from "effect";

import { PgClientLive } from "#/db";
import { EnvironmentLive, ServerEnv } from "#/lib/env";

const EnvLive = ServerEnv.layer.pipe(Layer.provide(EnvironmentLive));

const DatabaseLive = PgClientLive.pipe(Layer.provide(EnvLive));

const AppLive = Layer.mergeAll(DatabaseLive, EnvLive);

export const Runtime = ManagedRuntime.make(AppLive);
