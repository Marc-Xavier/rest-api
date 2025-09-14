// src/app.ts
import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import formbody from "@fastify/formbody";
import { userRoutes } from "./users/users.routes";
// import { productRoutes } from "./products/product.routes"; // convert similarly

dotenv.config();

const PORT = 3000;

const fastify = Fastify({
  logger: true,
});

async function build() {
  // Plugins (parity with your Express middlewares)
  await fastify.register(cors);
  await fastify.register(helmet);
  await fastify.register(formbody);

  // Routes
  await fastify.register(userRoutes, { prefix: "/" });
  // await fastify.register(productRoutes, { prefix: "/" });

  return fastify;
}

async function start() {
  const app = await build();
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`Server listening on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
