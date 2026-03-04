const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function main() {
  const adminHash = await hashPassword('admin123');
  const userHash = await hashPassword('user123');
  const driverHash = await hashPassword('driver123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@caronafam.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@caronafam.com',
      ra: 'ADMIN001',
      passwordHash: adminHash,
      role: 'ADMIN',
      isAdmin: true,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'motorista@caronafam.com' },
    update: {},
    create: {
      name: 'João Motorista',
      email: 'motorista@caronafam.com',
      ra: 'DRV001',
      passwordHash: driverHash,
      role: 'DRIVER',
    },
  });

  const passengerUser = await prisma.user.upsert({
    where: { email: 'usuario@caronafam.com' },
    update: {},
    create: {
      name: 'Maria Usuária',
      email: 'usuario@caronafam.com',
      ra: 'USR001',
      passwordHash: userHash,
      role: 'USER',
    },
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { plate: 'ABC-1234' },
    update: {},
    create: {
      driverId: driverUser.id,
      brand: 'Volkswagen',
      model: 'Gol',
      plate: 'ABC-1234',
      year: 2020,
      capacityTotal: 4,
    },
  });

  const ride = await prisma.ride.create({
    data: {
      driverId: driverUser.id,
      vehicleId: vehicle.id,
      origin: 'Campus Central',
      destination: 'Centro',
      distanceKm: 5.5,
      suggestedValue: 15.0,
      departureAt: new Date(Date.now() + 86400000),
      arrivalAt: new Date(Date.now() + 86400000 + 1800000),
      availableSeats: 3,
      status: 'ACTIVE',
    },
  });

  console.log('Seed executado com sucesso:');
  console.log('- Admin:', admin.email);
  console.log('- Motorista:', driverUser.email);
  console.log('- Usuário:', passengerUser.email);
  console.log('- Veículo:', vehicle.plate);
  console.log('- Corrida:', ride.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
