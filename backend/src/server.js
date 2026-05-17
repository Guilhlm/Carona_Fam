const config = require('./config/env');
const app = require('./app');
const logger = require('./utils/logger');

const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 2000;

async function waitForDatabase() {
  const { prisma } = require('./config/database');
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await prisma.$connect();
      logger.info('Banco de dados conectado com sucesso');
      return true;
    } catch (err) {
      logger.warn(`Tentativa ${i + 1}/${MAX_RETRIES} - Aguardando banco...`, err.message);
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
    }
  }
  throw new Error('Não foi possível conectar ao banco de dados após várias tentativas');
}

async function startServer() {
  try {
    if (config.databaseUrl) {
      await waitForDatabase();
      if (process.env.RUN_MIGRATIONS === 'true') {
        const { execSync } = require('child_process');
        try {
          execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        } catch (migrateErr) {
          logger.warn('Migrações podem não existir ainda. Execute prisma migrate dev localmente.');
        }
      }
    }

    app.listen(config.port, () => {
      logger.info(`Servidor rodando na porta ${config.port}`);
    });
  } catch (err) {
    logger.error('Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

startServer();
