import { NodeClusterSocket } from "@effect/platform-node";
import { Layer } from "effect";
import { ClusterWorkflowEngine } from "effect/unstable/cluster";

import { PgClientLive } from "#/db";
import { ServerEnvLive } from "#/lib/env";

export const WorkflowEngineLayer = ClusterWorkflowEngine.layer.pipe(
  Layer.provideMerge(NodeClusterSocket.layer()),
  Layer.provideMerge(PgClientLive.pipe(Layer.provide(ServerEnvLive))),
);
