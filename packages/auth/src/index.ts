import { db } from "@ai-suites/db";
import * as schema from "@ai-suites/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url))
});

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const microsoftConfigured = Boolean(
  process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

export const auth = betterAuth({
  appName: "AI Suites",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8000",
  trustedOrigins: [webOrigin],
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema
  }),
  socialProviders: {
    ...(googleConfigured
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            prompt: "select_account"
          }
        }
      : {}),
    ...(microsoftConfigured
      ? {
          microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID as string,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
            authority: "https://login.microsoftonline.com",
            prompt: "select_account",
            tenantId: "common"
          }
        }
      : {})
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"]
    }
  }
});
