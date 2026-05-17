require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'changeme-super-secret',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  databaseUrl: process.env.DATABASE_URL,
  ridePricing: {
    base: parseFloat(process.env.RIDE_PRICE_BASE || '5'),
    perKm: parseFloat(process.env.RIDE_PRICE_PER_KM || '2.5'),
    perMin: parseFloat(process.env.RIDE_PRICE_PER_MIN || '0.5'),
  },
};

if (!config.databaseUrl) {
  console.warn('AVISO: DATABASE_URL não definida. Configure no .env para conectar ao banco.');
}

if (
  config.nodeEnv === 'production' &&
  (!process.env.JWT_SECRET || config.jwtSecret === 'changeme-super-secret')
) {
  throw new Error('JWT_SECRET deve ser definido em produção.');
}

module.exports = config;
