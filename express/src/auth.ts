import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import db from "./db";

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin()
  ]
});
