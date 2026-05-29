import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return new Response("Hi");
      },
      POST: ({ request }) => {
        return new Response("Hi");
      },
    },
  },
});
