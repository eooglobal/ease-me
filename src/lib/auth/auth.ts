import { betterAuth } from "better-auth";
import { pool } from "@/db";

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "ease_me_dev_secret_key_at_least_32_chars_long_12345",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can be toggled in production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "ease_me",
  },
});
