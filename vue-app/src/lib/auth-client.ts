import { createAuthClient } from "better-auth/vue";
import { magicLinkClient, adminClient } from "better-auth/client/plugins";

const API_URL =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ""
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
    ? "http://localhost:8100"
    : (typeof window !== "undefined" ? window.location.origin : "http://localhost:8100");

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    magicLinkClient(),
    adminClient(),
  ]
});

export const { signIn, signUp, signOut, useSession } = authClient;
