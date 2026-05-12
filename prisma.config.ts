import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Prisma CLI does not auto-load .env.local — load both env files manually
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
