import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Map PRISMA_CLIENT_ENGINE_TYPE -> allowed defineConfig engine values.
  // Acceptable config values: "js" (Node-API / library) or "classic" (binary).
  // Accept env values: "library" | "node-api" | "js" -> "js", "binary" | "classic" -> "classic"
  engine: (() => {
    const ev = String(process.env.PRISMA_CLIENT_ENGINE_TYPE || "").toLowerCase();
    if (ev === "library" || ev === "node-api" || ev === "node_api" || ev === "js") return "js";
    if (ev === "binary" || ev === "classic") return "classic";
    // default to Node-API / library (js) for best compatibility
    return "js";
  })(),
  datasource: {
    url: env("DATABASE_URL"),
  },
});
