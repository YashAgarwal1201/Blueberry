import { createAuthClient } from "better-auth/vue";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8100";

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
