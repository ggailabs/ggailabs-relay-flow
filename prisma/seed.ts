import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a default user if it doesn't exist
  const defaultUser = await prisma.user.upsert({
    where: { id: 'default-user-id' },
    update: {},
    create: {
      id: 'default-user-id',
      email: 'default@example.com',
      name: 'Default User',
    },
  });

  console.log('Default user created:', defaultUser);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });