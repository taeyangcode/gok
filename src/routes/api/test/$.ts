import { createFileRoute } from "@tanstack/react-router";
import { Console, Effect } from "effect";

import { AudioSourceId } from "#/db/schema/audios";
import { Runtime } from "#/server/runtime";
import { AudioRepository } from "#/services/audio/audio-repository";

export const Route = createFileRoute("/api/test/$")({
  server: {
    handlers: {
      GET: ({ request }) =>
        Runtime.runPromise(
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan({
              "http.method": request.method,
              "url.path": request.url,
            });

            const audioRepository = yield* AudioRepository;
            yield* audioRepository
              .ensureDownloaded(AudioSourceId.make("wyexaEZIow8"))
              .pipe(Effect.tapCause((cause) => Console.error(cause.toString())));

            return new Response("Hello world");
          }).pipe(Effect.provide(AudioRepository.layer), Effect.withSpan("@gok/api/test/GET")),
        ),
    },
  },
});
