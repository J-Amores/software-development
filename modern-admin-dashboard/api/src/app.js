import Fastify from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health.js";
import { teamRoutes } from "./routes/team.js";
import { contactsRoutes } from "./routes/contacts.js";
import { invoicesRoutes } from "./routes/invoices.js";
import { eventsRoutes } from "./routes/events.js";
import { faqsRoutes } from "./routes/faqs.js";
import { metricsRoutes } from "./routes/metrics.js";
import { transactionsRoutes } from "./routes/transactions.js";
import { dashboardRoutes } from "./routes/dashboard.js";

/**
 * Builds and configures the Fastify application instance.
 *
 * @param {Object} [options={}]
 * @param {any} [options.db] - Database adapter instance
 * @param {boolean | object} [options.logger=false] - Fastify logger configuration
 * @param {string | string[] | boolean} [options.corsOrigin="*"] - Allowed CORS origins
 * @returns {Promise<import('fastify').FastifyInstance>}
 */
export async function createApp(options = {}) {
  const { db, logger = false, corsOrigin = "*", ...fastifyOptions } = options;

  const app = Fastify({
    logger,
    ...fastifyOptions,
  });

  await app.register(cors, {
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  if (db) {
    app.decorate("db", db);
  }

  await app.register(healthRoutes, { db });
  await app.register(teamRoutes, { db });
  await app.register(contactsRoutes, { db });
  await app.register(invoicesRoutes, { db });
  await app.register(eventsRoutes, { db });
  await app.register(faqsRoutes, { db });
  await app.register(metricsRoutes, { db });
  await app.register(transactionsRoutes, { db });
  await app.register(dashboardRoutes, { db });

  return app;
}

export { createApp as buildApp };
export default createApp;
