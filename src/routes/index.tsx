import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="p-8">
      <button onClick={() => authClient.signIn.social({ provider: "google" })}>Sign in</button>
      <button onClick={() => authClient.signOut()}>Sign out</button>
    </div>
  );
}
