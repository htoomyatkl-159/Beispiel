import { createApp } from './app.js';
import { readConfig } from './config.js';
import { createDatabase, configureDatabase } from './db.js';
import { createRecommenderClient } from './recommendations/client.js';

try {
  const config = readConfig();
  const database = createDatabase();
  await configureDatabase(database);
  const app = createApp({ database, recommender: createRecommenderClient(config.recommenderBaseUrl, config.recommenderTimeoutMs) });
  app.set('env', config.nodeEnv);
  const server = app.listen(config.port, config.host, () => {
    const host = config.host.includes(':') ? `[${config.host}]` : config.host;
    console.log(`API listening at http://${host}:${config.port}/api/v1/health/live`);
  });
  server.on('error', (error: NodeJS.ErrnoException) => {
    console.error(error.code === 'EADDRINUSE'
      ? `Port ${config.port} is already in use. Stop the other server or choose a different PORT.`
      : 'The API could not open its listening port. Check HOST and PORT.');
    process.exitCode = 1;
    void database.$disconnect();
  });
  const shutdown = () => {
    server.close((error) => {
      void database.$disconnect().finally(() => { process.exitCode = error ? 1 : 0; });
    });
    server.closeIdleConnections();
    setTimeout(() => { server.closeAllConnections(); }, 5000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch (error) {
  console.error(`API startup failed: ${error instanceof Error ? error.message : 'Invalid configuration.'}`);
  process.exitCode = 1;
}
