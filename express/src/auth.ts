import { betterAuth } from "better-auth";
import { admin, magicLink } from "better-auth/plugins";
import db from "./db";
import fs from "fs";
import path from "path";

const certPath = path.join(process.cwd(), "certs", "localhost.pem");
const keyPath = path.join(process.cwd(), "certs", "localhost-key.pem");
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);
const defaultBaseUrl = hasCerts ? "https://localhost:8100" : "http://localhost:8100";

export const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL || defaultBaseUrl,
  trustedOrigins: ["http://localhost:5130", "http://127.0.0.1:5130", "https://localhost:5130", "https://127.0.0.1:5130"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url, token }, request) => {
      // [TODO - EMAIL SERVER SETUP]: Integrate a real SMTP/Email provider (e.g., Resend, SendGrid, AWS SES) here in the future.
      // Example: await emailClient.sendEmail({ to: user.email, subject: "Reset Password", body: `Click here: ${url}` });
      
      console.log(`\n=== 🔐 PASSWORD RESET REQUEST ===`);
      console.log(`For: ${user.email}`);
      console.log(`Token: ${token}`);
      console.log(`Reset Link: ${url}`);
      console.log(`=================================\n`);
    },
  },
  plugins: [
    admin(),
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        // [TODO - EMAIL SERVER SETUP]: Integrate a real SMTP/Email provider (e.g., Resend, SendGrid, AWS SES) here in the future.
        // Example: await emailClient.sendEmail({ to: email, subject: "Your Magic Link", body: `Click here: ${url}` });
        
        console.log(`\n=== ✉️ MAGIC LINK REQUEST ===`);
        console.log(`For: ${email}`);
        console.log(`Token: ${token}`);
        console.log(`Magic Link: ${url}`);
        console.log(`=============================\n`);
      },
    })
  ]
});
