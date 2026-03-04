require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'changeme-super-secret',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  databaseUrl: process.env.DATABASE_URL,
};

if (!config.databaseUrl) {
  console.warn('AVISO: DATABASE_URL não definida. Configure no .env para conectar ao banco.');
}

module.exports = config;
