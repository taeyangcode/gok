import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test/$")({
  server: {
    handlers: {
      GET: ({ request }) => new Response("Hi"),
      POST: ({ request }) => new Response("Hi"),
    },
  },
});
