import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

const baseURL = import.meta.env.DEV
  ? "http://localhost:8787"
  : import.meta.env.VITE_API_URL || window.location.origin;

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  plugins: [magicLinkClient()],
});

export const { signIn, signOut, useSession } = authClient;
