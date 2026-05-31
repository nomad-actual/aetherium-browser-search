import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import fastifyStatic from "@fastify/static";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildConfig, envSchema } from "./config.js";
import { buildRoutes } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..", "..");

function redactUrl(url: string): string {
  try {
    const parsed = new URL(url, "http://localhost");
    const params = parsed.searchParams;
    for (const key of ["q", "apiKey", "token"]) {
      if (params.has(key)) {
        params.set(key, "***");
      }
    }
    return parsed.pathname + parsed.search.toString();
  } catch {
    return url;
  }
}

async function bootstrap() {
  dotenv.config();
  const config = buildConfig(process.env);

  const server = Fastify({
    logger: {
      level: "info",
      serializers: {
        req: (req: any) => {
          return {
            method: req.method,
            url: redactUrl(req.url),
            id: req.id,
            remoteAddress: req.remoteAddress,
            remotePort: req.remotePort,
          };
        },
      },
    },
  });

  await server.register(fastifyCors, { origin: true });

  await server.register(fastifyEnv, {
    dotenv: true,
    schema: envSchema,
    data: process.env
  });

  const shutdown = new AbortController();

  server.addHook("onClose", async () => {
    shutdown.abort();
    await new Promise(res => setTimeout(res, 1000));
  });

  // Serve static files from public/
  await server.register(fastifyStatic, {
    root: join(rootDir, "public"),
    prefix: "/",
    decorateReply: false
  });

  // Serve compiled client JS from dist/client/ at /js/
  await server.register(fastifyStatic, {
    root: join(rootDir, "dist", "client"),
    prefix: "/js/",
    decorateReply: false
  });

  // Serve OpenSearch description
  server.get("/opensearch", async (_request, reply) => {
    const fs = await import("node:fs");
    const xml = fs.readFileSync(join(rootDir, "opensearch.xml"), "utf-8");
    return reply.type("application/opensearchdescription+xml").send(xml);
  });

  // Root and /search serve the SPA shell
  server.get("/", async (_request, reply) => {
    const fs = await import("node:fs");
    const html = fs.readFileSync(join(rootDir, "public", "index.html"), "utf-8");
    return reply.type("text/html").send(html);
  });

  server.get("/search", async (_request, reply) => {
    const fs = await import("node:fs");
    const html = fs.readFileSync(join(rootDir, "public", "index.html"), "utf-8");
    return reply.type("text/html").send(html);
  });

  buildRoutes(server, config, shutdown.signal);

  const host = process.env.HOST || "0.0.0.0";
  const port = parseInt(process.env.PORT || "3000", 10);

  await server.listen({ port, host });
  server.log.info(`HTTP server listening on http://${host}:${port}`);

  return server;
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
