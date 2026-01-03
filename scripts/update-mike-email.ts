import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // First check current email
  const mike = await prisma.user.findFirst({
    where: { name: { contains: 'Mike' } }
  });
  console.log('Current Mike:', mike?.email);

  if (mike && mike.email !== 'piyoosh.rai@the-algo.com') {
    const updated = await prisma.user.update({
      where: { id: mike.id },
      data: { email: 'piyoosh.rai@the-algo.com' },
    });
    console.log('Updated Mike email to:', updated.email);
  } else if (mike) {
    console.log('Mike email already set to:', mike.email);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
