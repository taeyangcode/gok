import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { config } from "dotenv";
import { Pool } from "pg";

config({ path: [".env.local"] });

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  plugins: [tanstackStartCookies()],
});
