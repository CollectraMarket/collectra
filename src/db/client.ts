import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { getRequiredDatabaseUrl } from "@/lib/env";

dotenv.config({ path: ".env.local" });

const sql = postgres(getRequiredDatabaseUrl(), {
  prepare: false,
});

export const db = drizzle(sql, { schema });
