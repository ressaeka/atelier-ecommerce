import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const password = await bcrypt.hash('Admin123!', 12);

  await prisma.user.upsert({
    where: {
      username: 'admin123',
    },

    update: {
      email: 'admin@example.com',
      name: 'admin',
      phone: '+6281234567890',
      password,
      role: 'ADMIN',
    },

    create: {
      email: 'admin@example.com',
      name: 'admin',
      username: 'admin123',
      phone: '+6281234567890',
      password,
      role: 'ADMIN',
    },
  });

  console.log('Admin berhasil dibuat');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
