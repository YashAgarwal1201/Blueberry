import { createAuthClient } from "better-auth/vue";
import { magicLinkClient } from "better-auth/client/plugins";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8100";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    magicLinkClient()
  ]
});

export const { signIn, signUp, signOut, useSession } = authClient;
