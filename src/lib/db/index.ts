import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { libsql?: Client };

const client =
  globalForDb.libsql ??
  createClient({
    url: process.env.DATABASE_URL ?? "file:./data/vanik.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
if (!globalForDb.libsql && client.protocol === "file") {
  void client.executeMultiple("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
}
if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export type DB = typeof db;
export { schema };
