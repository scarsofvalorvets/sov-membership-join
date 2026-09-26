import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js reads .env.local / .env automatically; the Prisma CLI does not.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
