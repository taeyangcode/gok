import { Effect, Layer, Redacted } from "effect";
import { OtlpLogger, OtlpTracer } from "effect/unstable/observability";

import { ServerEnv } from "#/lib/env";

const Tracer = Layer.unwrap(
  Effect.gen(function* () {
    const { HoneycombApiKey, RailwayEnvironmentName, RailwayServiceName } = yield* ServerEnv;

    return OtlpTracer.layer({
      url: "https://api.honeycomb.io/v1/traces",
      headers: {
        "x-honeycomb-team": Redacted.value(HoneycombApiKey),
      },
      resource: {
        serviceName: `${Redacted.value(RailwayServiceName)}-${Redacted.value(RailwayEnvironmentName)}`,
        serviceVersion: "1.0.0",
        attributes: {
          "railway.environment.name": Redacted.value(RailwayEnvironmentName),
          "railway.service.name": Redacted.value(RailwayServiceName),
        },
      },
    });
  }),
);

const Logger = Layer.unwrap(
  Effect.gen(function* () {
    const { HoneycombApiKey, RailwayEnvironmentName, RailwayServiceName } = yield* ServerEnv;

    return OtlpLogger.layer({
      url: "https://api.honeycomb.io",
      headers: {
        "x-honeycomb-team": Redacted.value(HoneycombApiKey),
      },
      resource: {
        serviceName: `${Redacted.value(RailwayServiceName)}-${Redacted.value(RailwayEnvironmentName)}`,
        serviceVersion: "1.0.0",
        attributes: {
          "railway.environment.name": Redacted.value(RailwayEnvironmentName),
          "railway.service.name": Redacted.value(RailwayServiceName),
        },
      },
    });
  }),
);

export const ObservabilityLayer = Layer.merge(Tracer, Logger);
