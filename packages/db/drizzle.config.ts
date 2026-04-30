import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { fileURLToPath } from "node:url";

config({
  path: fileURLToPath(new URL("../../.env", import.meta.url))
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Drizzle commands.");
}

export default defineConfig({
  dialect: "mysql",
  out: "./drizzle",
  schema: "./src/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
});
