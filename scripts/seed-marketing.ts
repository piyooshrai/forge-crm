import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get Mike's user ID
  const mike = await prisma.user.findFirst({ where: { email: 'mike@forge.com' } });
  if (!mike) {
    console.log('Mike not found');
    return;
  }
  console.log('Found Mike:', mike.id);

  // Create sample marketing tasks with various outcomes
  const tasks = [
    { type: 'LINKEDIN_OUTREACH', description: 'Connected with CTO at TechCorp', outcome: 'SUCCESS', leadGenerated: true },
    { type: 'LINKEDIN_OUTREACH', description: 'Reached out to VP Sales at SalesForce', outcome: 'SUCCESS', leadGenerated: false },
    { type: 'LINKEDIN_OUTREACH', description: 'Message to HR Director', outcome: 'FAILED', leadGenerated: false },
    { type: 'COLD_EMAIL', description: 'Email campaign to fintech leads', outcome: 'SUCCESS', leadGenerated: true },
    { type: 'COLD_EMAIL', description: 'Follow-up sequence batch 1', outcome: 'PARTIAL', leadGenerated: false },
    { type: 'COLD_EMAIL', description: 'Outreach to healthcare sector', outcome: 'FAILED', leadGenerated: false },
    { type: 'SOCIAL_POST', description: 'LinkedIn article on AI trends', outcome: 'SUCCESS', leadGenerated: true },
    { type: 'SOCIAL_POST', description: 'Twitter thread on sales tips', outcome: 'SUCCESS', leadGenerated: false },
    { type: 'BLOG_POST', description: 'Case study: Enterprise client win', outcome: 'SUCCESS', leadGenerated: true },
    { type: 'WEBINAR', description: 'Product demo webinar', outcome: 'SUCCESS', leadGenerated: true },
    { type: 'EVENT', description: 'Trade show booth at SaaStr', outcome: 'PARTIAL', leadGenerated: true },
    { type: 'CONTENT_CREATION', description: 'Whitepaper on ROI metrics', outcome: 'SUCCESS', leadGenerated: false },
  ];

  for (const task of tasks) {
    await prisma.marketingTask.create({
      data: {
        type: task.type as any,
        description: task.description,
        status: 'COMPLETED',
        outcome: task.outcome as any,
        leadGenerated: task.leadGenerated,
        userId: mike.id,
        taskDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Created', tasks.length, 'marketing tasks for Mike');

  const count = await prisma.marketingTask.count({ where: { userId: mike.id } });
  console.log('Total marketing tasks:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
