import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { buildConfig, envSchema } from "./config.js";
import { buildRoutes } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function bootstrap() {
  dotenv.config();
  const config = buildConfig(process.env);

  const server = Fastify({
    logger: { level: "info" }
  });

  await server.register(fastifyCors, { origin: true });

  await server.register(fastifyEnv, {
    dotenv: true,
    schema: envSchema,
    data: process.env
  });

  // Serve the HTML shell
  const shellHtml = readFileSync(join(__dirname, "..", "public", "index.html"), "utf-8");

  const shutdown = new AbortController();

  server.addHook("onClose", async () => {
    shutdown.abort();
    await new Promise(res => setTimeout(res, 1000));
  });

  buildRoutes(server, config, shutdown.signal);

  const host = process.env.HOST || "0.0.0.0";
  const port = parseInt(process.env.PORT || "3000", 10);

  // Serve static public files
  server.register(async (instance) => {
    instance.register(import("@fastify/static"), {
      root: join(__dirname, "..", "public"),
      prefix: "/static/"
    });
  });

  // Root serves the HTML shell
  server.get("/", async (_, reply) => {
    return reply.type("text/html").send(shellHtml);
  });

  await server.listen({ port, host });
  server.log.info(`HTTP server listening on http://${host}:${port}`);

  return server;
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
