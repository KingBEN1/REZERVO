import { createApp } from './app.js';
import { env } from './config.js';
import { prisma } from './db.js';

const app = createApp();
const server = app.listen(env.PORT, () => console.info(`Rezervo API listening on :${env.PORT}`));

async function shutdown(signal: string) {
  console.info(`${signal} received: closing server`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
