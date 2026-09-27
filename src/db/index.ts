import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString || "postgresql://app_user:password@localhost:5432/ease_me",
});

export const db = drizzle(pool, {
  schema,
});

export { pool };
export * from "./schema";
