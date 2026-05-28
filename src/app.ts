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

  buildRoutes(server, config);

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
  server.get("/", async (request, reply) => {
    return reply.type("text/html").send(shellHtml);
  });

  if (process.env.HTTPS === "true") {
    const https = await import("node:https");
    const fs = await import("node:fs");

    try {
      const httpsOptions = {
        cert: fs.readFileSync(process.env.HTTPS_CERT_FILE || "/certs/cert.pem"),
        key: fs.readFileSync(process.env.HTTPS_KEY_FILE || "/certs/key.pem")
      };

      await server.listen({ port, host }, (err) => {
        if (err) {
          server.log.error(err);
          process.exit(1);
        }
        server.log.info(`HTTPS server listening on https://${host}:${port}`);
      });
    } catch (err: any) {
      server.log.warn(
        `HTTPS cert files not found. Falling back to HTTP.`
      );
      await server.listen({ port, host });
      server.log.info(`HTTP server listening on http://${host}:${port}`);
    }
  } else {
    await server.listen({ port, host });
    server.log.info(`HTTP server listening on http://${host}:${port}`);
  }

  return server;
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
