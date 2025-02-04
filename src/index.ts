/* eslint-disable no-console */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cfg from './envalid.js';
import {
  fetchFFlagHandler,
  getEnvironmentFFlagsHandler,
} from './client.controller.js';

const server = Fastify({
  logger: true,
});
// check if service is up during deployment; check on regular frequency
server.get('/healthcheck', async () => ({ status: 'OK' }));
server.register(cors, { origin: '*' });
server.post('/api/fflag', fetchFFlagHandler);
server.post('/api/fflags', getEnvironmentFFlagsHandler);

server.listen({ port: cfg.FLAG_RELAY_PORT }, (error, address) => {
  if (error instanceof Error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`\nFeature flag relay running at ${address}`);
});
