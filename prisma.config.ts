import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// compute engine value and assert types for TS discrimination
const engineValue = (() => {
  const ev = String(process.env.PRISMA_CLIENT_ENGINE_TYPE || "").toLowerCase();
  if (ev === "library" || ev === "node-api" || ev === "node_api" || ev === "js") return "js";
  if (ev === "binary" || ev === "classic") return "classic";
  return "js";
})() as "js" | "classic";

export default defineConfig(
  // Type assertion to avoid discriminated-union compile issue while keeping runtime mapping
  ({
    schema: "prisma/schema.prisma",
    migrations: {
      path: "prisma/migrations",
    },
    engine: engineValue,
    datasource: {
      url: env("DATABASE_URL"),
    },
  } as unknown) as any
);
