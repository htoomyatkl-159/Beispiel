import express from 'express';
import { createErrorHandler, notFound } from './middleware/errors.js';
import { requestContext } from './middleware/request-context.js';
import type { PrismaClient } from './generated/prisma/client.js';
import { createCatalogRouter } from './catalog/routes.js';
import { createRecommendationRouter } from './recommendations/routes.js';
import type { RecommenderClient } from './recommendations/client.js';
import type { ApiConfig } from './config.js';
import { createAuthRouter } from './auth/routes.js';
import { createFeedbackRouter } from './feedback/routes.js';

/** Build the app without opening a port, reading .env, or contacting any service. */
export function createApp(options: { database?: PrismaClient; recommender?: RecommenderClient; config?: ApiConfig } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext);
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/v1/health/live', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ data: { status: 'ok' }, meta: { requestId: res.locals.requestId } });
  });

  app.use('/api/v1', createAuthRouter(options.database, options.config));
  app.use('/api/v1', createFeedbackRouter(options.database, options.config));

  app.use('/api/v1', createCatalogRouter(options.database));
  app.use('/api/v1', createRecommendationRouter(options.database, options.recommender, options.config));
  app.use(notFound);
  app.use(createErrorHandler());
  return app;
}
