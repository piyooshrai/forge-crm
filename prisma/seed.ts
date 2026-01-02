import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@forge.com' },
    update: {},
    create: {
      email: 'admin@forge.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  // Create Sales Reps
  const salesRep1 = await prisma.user.upsert({
    where: { email: 'sales1@forge.com' },
    update: {},
    create: {
      email: 'sales1@forge.com',
      password: hashedPassword,
      name: 'Sales Rep 1',
      role: UserRole.SALES_REP,
    },
  });

  const salesRep2 = await prisma.user.upsert({
    where: { email: 'sales2@forge.com' },
    update: {},
    create: {
      email: 'sales2@forge.com',
      password: hashedPassword,
      name: 'Sales Rep 2',
      role: UserRole.SALES_REP,
    },
  });

  // Create Marketing Rep
  const marketingRep = await prisma.user.upsert({
    where: { email: 'marketing@forge.com' },
    update: {},
    create: {
      email: 'marketing@forge.com',
      password: hashedPassword,
      name: 'Marketing Rep',
      role: UserRole.MARKETING_REP,
    },
  });

  console.log('Seeded users:', {
    superAdmin: superAdmin.email,
    salesRep1: salesRep1.email,
    salesRep2: salesRep2.email,
    marketingRep: marketingRep.email,
  });

  console.log('✅ Seeding completed!');
  console.log('All users have password: password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

