import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";
import * as schema from "./schema.js";

config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url))
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

export const pool = mysql.createPool(databaseUrl);

export const db = drizzle(pool, {
  mode: "default",
  schema
});
