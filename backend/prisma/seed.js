const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@carona.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin Carona';
const ADMIN_ROLE = 'ADMIN';

async function createOrUpdateAdmin() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existingAdmin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existingAdmin) {
    const updatedAdmin = await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        name: ADMIN_NAME,
        passwordHash,
        role: ADMIN_ROLE,
        isAdmin: true,
        isBlocked: false,
      },
    });

    console.log('Admin temporário atualizado:', updatedAdmin.email);
    return updatedAdmin;
  }

  const newAdmin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      role: ADMIN_ROLE,
      isAdmin: true,
      isBlocked: false,
    },
  });

  console.log('Admin temporário criado:', newAdmin.email);
  return newAdmin;
}

async function main() {
  await createOrUpdateAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });