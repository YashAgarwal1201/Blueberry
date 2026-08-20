import { betterAuth } from "better-auth";
import { admin, magicLink } from "better-auth/plugins";
import db from "./db";

export const auth = betterAuth({
  database: db,
  trustedOrigins: ["http://localhost:5130"],
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
