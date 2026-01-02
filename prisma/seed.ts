import { PrismaClient, UserRole, LeadSource, LeadStatus, Pipeline, DealStage, AmountType, ActivityType, ProductType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Helper to get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to get past date (days ago)
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Helper to get future date (days from now)
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.dealLineItem.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // ============ USERS ============
  console.log('👤 Creating users...');
  const hashedPassword = await hashPassword('password123');

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@forge.com',
        password: hashedPassword,
        name: 'Sarah Admin',
        role: UserRole.SUPER_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'john@forge.com',
        password: hashedPassword,
        name: 'John Smith',
        role: UserRole.SALES_REP,
      },
    }),
    prisma.user.create({
      data: {
        email: 'emily@forge.com',
        password: hashedPassword,
        name: 'Emily Johnson',
        role: UserRole.SALES_REP,
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike@forge.com',
        password: hashedPassword,
        name: 'Mike Wilson',
        role: UserRole.MARKETING_REP,
      },
    }),
  ]);

  const [admin, john, emily, mike] = users;
  console.log(`  ✓ Created ${users.length} users`);

  // ============ PRODUCTS ============
  console.log('📦 Creating products...');
  const products = await Promise.all([
    // IT Services
    prisma.product.create({
      data: {
        name: 'Cloud Infrastructure Setup',
        description: 'Complete cloud infrastructure design and implementation',
        category: 'IT Services',
        unitPrice: 15000,
        type: ProductType.ONE_TIME,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Managed IT Support',
        description: 'Monthly managed IT support and monitoring',
        category: 'IT Services',
        unitPrice: 2500,
        type: ProductType.RECURRING,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Security Audit',
        description: 'Comprehensive security assessment and recommendations',
        category: 'IT Services',
        unitPrice: 8000,
        type: ProductType.ONE_TIME,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Network Design',
        description: 'Enterprise network architecture and implementation',
        category: 'IT Services',
        unitPrice: 12000,
        type: ProductType.ONE_TIME,
      },
    }),
    // SaaS Products
    prisma.product.create({
      data: {
        name: 'CRM License',
        description: 'Enterprise CRM software license',
        category: 'SaaS Products',
        unitPrice: 299,
        type: ProductType.RECURRING,
      },
    }),
    prisma.product.create({
      data: {
        name: 'ERP System',
        description: 'Full ERP implementation and licensing',
        category: 'SaaS Products',
        unitPrice: 50000,
        type: ProductType.ONE_TIME,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Analytics Platform',
        description: 'Business intelligence and analytics tool',
        category: 'SaaS Products',
        unitPrice: 199,
        type: ProductType.RECURRING,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Collaboration Suite',
        description: 'Team collaboration and communication platform',
        category: 'SaaS Products',
        unitPrice: 15,
        type: ProductType.RECURRING,
      },
    }),
    // Staffing
    prisma.product.create({
      data: {
        name: 'Senior Developer',
        description: 'Full-stack senior developer staffing',
        category: 'Staffing',
        unitPrice: 95,
        type: ProductType.RECURRING,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Project Manager',
        description: 'Technical project management',
        category: 'Staffing',
        unitPrice: 85,
        type: ProductType.RECURRING,
      },
    }),
    prisma.product.create({
      data: {
        name: 'QA Engineer',
        description: 'Quality assurance and testing specialist',
        category: 'Staffing',
        unitPrice: 65,
        type: ProductType.RECURRING,
      },
    }),
    prisma.product.create({
      data: {
        name: 'DevOps Engineer',
        description: 'DevOps and infrastructure specialist',
        category: 'Staffing',
        unitPrice: 90,
        type: ProductType.RECURRING,
      },
    }),
    // Consulting
    prisma.product.create({
      data: {
        name: 'Strategy Consulting',
        description: 'IT strategy and digital transformation consulting',
        category: 'Consulting',
        unitPrice: 200,
        type: ProductType.RECURRING,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Technical Audit',
        description: 'Comprehensive technical infrastructure audit',
        category: 'Consulting',
        unitPrice: 10000,
        type: ProductType.ONE_TIME,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Training Workshop',
        description: 'Custom technical training and workshops',
        category: 'Consulting',
        unitPrice: 5000,
        type: ProductType.ONE_TIME,
      },
    }),
  ]);
  console.log(`  ✓ Created ${products.length} products`);

  // ============ LEADS ============
  console.log('🎯 Creating leads...');
  const leadData = [
    { name: 'Robert Chen', email: 'robert.chen@techflow.com', phone: '+1-555-0101', company: 'TechFlow Inc', title: 'CTO', source: LeadSource.WEBSITE, status: LeadStatus.NEW, regionTags: ['US'], ownerId: john.id },
    { name: 'Amanda Foster', email: 'a.foster@globalretail.com', phone: '+1-555-0102', company: 'Global Retail Corp', title: 'IT Director', source: LeadSource.REFERRAL, status: LeadStatus.CONTACTED, regionTags: ['US', 'EU'], ownerId: emily.id },
    { name: 'James Wilson', email: 'jwilson@meditech.co.uk', phone: '+44-20-7946-0958', company: 'MediTech Solutions', title: 'CEO', source: LeadSource.LINKEDIN, status: LeadStatus.QUALIFIED, regionTags: ['UK'], ownerId: john.id },
    { name: 'Lisa Park', email: 'lisa.park@finserve.com', phone: '+1-555-0104', company: 'FinServe Partners', title: 'VP Operations', source: LeadSource.COLD_CALL, status: LeadStatus.NEW, regionTags: ['US'], ownerId: emily.id },
    { name: 'Michael Brown', email: 'm.brown@eurotech.de', phone: '+49-30-1234-5678', company: 'EuroTech GmbH', title: 'Head of IT', source: LeadSource.WEBSITE, status: LeadStatus.CONTACTED, regionTags: ['EU'], ownerId: john.id },
    { name: 'Sarah Ahmed', email: 'sahmed@gulfenergy.ae', phone: '+971-4-555-1234', company: 'Gulf Energy Systems', title: 'CIO', source: LeadSource.REFERRAL, status: LeadStatus.QUALIFIED, regionTags: ['ME'], ownerId: emily.id },
    { name: 'David Kim', email: 'dkim@pacificlogistics.com', phone: '+1-555-0107', company: 'Pacific Logistics', title: 'Operations Manager', source: LeadSource.LINKEDIN, status: LeadStatus.UNQUALIFIED, regionTags: ['US'], ownerId: mike.id },
    { name: 'Jennifer Lee', email: 'jlee@innovatetech.com', phone: '+1-555-0108', company: 'InnovateTech', title: 'Product Director', source: LeadSource.WEBSITE, status: LeadStatus.NEW, regionTags: ['US'], ownerId: john.id },
    { name: 'Thomas Wright', email: 't.wright@ukhealthcare.nhs.uk', phone: '+44-20-7946-0959', company: 'UK Healthcare Trust', title: 'IT Manager', source: LeadSource.COLD_CALL, status: LeadStatus.CONTACTED, regionTags: ['UK'], ownerId: emily.id },
    { name: 'Maria Garcia', email: 'mgarcia@latinobank.mx', phone: '+52-55-1234-5678', company: 'Latino Bank', title: 'Technology Director', source: LeadSource.REFERRAL, status: LeadStatus.NEW, regionTags: ['US'], ownerId: john.id },
    { name: 'Peter Schmidt', email: 'pschmidt@germanauto.de', phone: '+49-89-1234-5678', company: 'German Auto Works', title: 'Plant Manager', source: LeadSource.LINKEDIN, status: LeadStatus.QUALIFIED, regionTags: ['EU'], ownerId: emily.id },
    { name: 'Rachel Green', email: 'rgreen@fashionforward.com', phone: '+1-555-0112', company: 'Fashion Forward', title: 'COO', source: LeadSource.WEBSITE, status: LeadStatus.CONTACTED, regionTags: ['US', 'UK'], ownerId: mike.id },
    { name: 'Ahmed Hassan', email: 'ahassan@dubaitech.ae', phone: '+971-4-555-5678', company: 'Dubai Tech Hub', title: 'Managing Director', source: LeadSource.REFERRAL, status: LeadStatus.NEW, regionTags: ['ME'], ownerId: john.id },
    { name: 'Christine Taylor', email: 'ctaylor@aussiemining.com.au', phone: '+61-2-9876-5432', company: 'Aussie Mining Corp', title: 'IT Director', source: LeadSource.COLD_CALL, status: LeadStatus.UNQUALIFIED, regionTags: ['US'], ownerId: emily.id },
    { name: 'Daniel Martinez', email: 'dmartinez@spaintelco.es', phone: '+34-91-123-4567', company: 'Spain Telco', title: 'CTO', source: LeadSource.LINKEDIN, status: LeadStatus.CONTACTED, regionTags: ['EU'], ownerId: john.id },
    { name: 'Nancy White', email: 'nwhite@canadahealth.ca', phone: '+1-416-555-0116', company: 'Canada Health Services', title: 'VP Technology', source: LeadSource.WEBSITE, status: LeadStatus.NEW, regionTags: ['US'], ownerId: mike.id },
    { name: 'Kevin O\'Brien', email: 'kobrien@irishsoft.ie', phone: '+353-1-234-5678', company: 'Irish Software Ltd', title: 'Technical Lead', source: LeadSource.REFERRAL, status: LeadStatus.QUALIFIED, regionTags: ['UK', 'EU'], ownerId: emily.id },
    { name: 'Sophia Anderson', email: 'sanderson@nordicbank.se', phone: '+46-8-123-4567', company: 'Nordic Bank', title: 'Digital Director', source: LeadSource.LINKEDIN, status: LeadStatus.CONTACTED, regionTags: ['EU'], ownerId: john.id },
    { name: 'Ryan Thompson', email: 'rthompson@usmanufacturing.com', phone: '+1-555-0119', company: 'US Manufacturing Inc', title: 'Operations Director', source: LeadSource.COLD_CALL, status: LeadStatus.NEW, regionTags: ['US'], ownerId: emily.id },
    { name: 'Emma Davis', email: 'edavis@londonfinance.co.uk', phone: '+44-20-7946-0960', company: 'London Finance Group', title: 'Head of Operations', source: LeadSource.WEBSITE, status: LeadStatus.QUALIFIED, regionTags: ['UK'], ownerId: john.id },
  ];

  const leads = await Promise.all(
    leadData.map((data) =>
      prisma.lead.create({
        data: {
          ...data,
          createdAt: randomDate(daysAgo(90), daysAgo(1)),
        },
      })
    )
  );
  console.log(`  ✓ Created ${leads.length} leads`);

  // ============ DEALS ============
  console.log('💼 Creating deals...');
  const dealData = [
    // IT Services Pipeline
    { name: 'TechFlow Cloud Migration', pipeline: Pipeline.IT_SERVICES, stage: DealStage.PROPOSAL, amountType: AmountType.FIXED, amountTotal: 75000, probability: 60, closeDate: daysFromNow(45), source: LeadSource.WEBSITE, regionTags: ['US'], ownerId: john.id, company: 'TechFlow Inc' },
    { name: 'Global Retail IT Modernization', pipeline: Pipeline.IT_SERVICES, stage: DealStage.DISCOVERY, amountType: AmountType.FIXED, amountTotal: 120000, probability: 40, closeDate: daysFromNow(60), source: LeadSource.REFERRAL, regionTags: ['US', 'EU'], ownerId: emily.id, company: 'Global Retail Corp' },
    { name: 'MediTech Security Overhaul', pipeline: Pipeline.IT_SERVICES, stage: DealStage.NEGOTIATION, amountType: AmountType.FIXED, amountTotal: 95000, probability: 75, closeDate: daysFromNow(20), source: LeadSource.LINKEDIN, regionTags: ['UK'], ownerId: john.id, company: 'MediTech Solutions' },
    { name: 'FinServe Infrastructure', pipeline: Pipeline.IT_SERVICES, stage: DealStage.QUALIFIED, amountType: AmountType.HOURLY, hourlyRate: 150, expectedHours: 500, amountTotal: 75000, probability: 30, closeDate: daysFromNow(90), source: LeadSource.COLD_CALL, regionTags: ['US'], ownerId: emily.id, company: 'FinServe Partners' },
    { name: 'EuroTech Network Upgrade', pipeline: Pipeline.IT_SERVICES, stage: DealStage.CLOSED_WON, amountType: AmountType.FIXED, amountTotal: 85000, probability: 100, closeDate: daysAgo(15), source: LeadSource.WEBSITE, regionTags: ['EU'], ownerId: john.id, company: 'EuroTech GmbH' },
    { name: 'Gulf Energy Digital Transform', pipeline: Pipeline.IT_SERVICES, stage: DealStage.PROPOSAL, amountType: AmountType.FIXED, amountTotal: 250000, probability: 55, closeDate: daysFromNow(75), source: LeadSource.REFERRAL, regionTags: ['ME'], ownerId: emily.id, company: 'Gulf Energy Systems' },
    { name: 'InnovateTech DevOps Setup', pipeline: Pipeline.IT_SERVICES, stage: DealStage.LEAD, amountType: AmountType.HOURLY, hourlyRate: 125, expectedHours: 200, amountTotal: 25000, probability: 15, closeDate: daysFromNow(120), source: LeadSource.WEBSITE, regionTags: ['US'], ownerId: john.id, company: 'InnovateTech' },
    { name: 'UK Healthcare System Integration', pipeline: Pipeline.IT_SERVICES, stage: DealStage.DISCOVERY, amountType: AmountType.FIXED, amountTotal: 180000, probability: 35, closeDate: daysFromNow(100), source: LeadSource.COLD_CALL, regionTags: ['UK'], ownerId: emily.id, company: 'UK Healthcare Trust' },
    { name: 'German Auto IoT Platform', pipeline: Pipeline.IT_SERVICES, stage: DealStage.CLOSED_LOST, amountType: AmountType.FIXED, amountTotal: 300000, probability: 0, closeDate: daysAgo(30), source: LeadSource.LINKEDIN, regionTags: ['EU'], ownerId: john.id, company: 'German Auto Works' },
    // ALL Products Pipeline
    { name: 'Fashion Forward CRM Implementation', pipeline: Pipeline.ALL_PRODUCTS, stage: DealStage.NEGOTIATION, amountType: AmountType.RETAINER, amountTotal: 60000, probability: 70, closeDate: daysFromNow(15), source: LeadSource.WEBSITE, regionTags: ['US', 'UK'], ownerId: emily.id, company: 'Fashion Forward' },
    { name: 'Dubai Tech ERP Deployment', pipeline: Pipeline.ALL_PRODUCTS, stage: DealStage.PROPOSAL, amountType: AmountType.FIXED, amountTotal: 150000, probability: 50, closeDate: daysFromNow(50), source: LeadSource.REFERRAL, regionTags: ['ME'], ownerId: john.id, company: 'Dubai Tech Hub' },
    { name: 'Spain Telco Analytics Suite', pipeline: Pipeline.ALL_PRODUCTS, stage: DealStage.DISCOVERY, amountType: AmountType.RETAINER, amountTotal: 42000, probability: 40, closeDate: daysFromNow(80), source: LeadSource.LINKEDIN, regionTags: ['EU'], ownerId: emily.id, company: 'Spain Telco' },
    { name: 'Canada Health Collaboration Tools', pipeline: Pipeline.ALL_PRODUCTS, stage: DealStage.QUALIFIED, amountType: AmountType.RETAINER, amountTotal: 96000, probability: 25, closeDate: daysFromNow(110), source: LeadSource.WEBSITE, regionTags: ['US'], ownerId: john.id, company: 'Canada Health Services' },
    { name: 'Nordic Bank Security Suite', pipeline: Pipeline.ALL_PRODUCTS, stage: DealStage.CLOSED_WON, amountType: AmountType.FIXED, amountTotal: 75000, probability: 100, closeDate: daysAgo(10), source: LeadSource.LINKEDIN, regionTags: ['EU'], ownerId: emily.id, company: 'Nordic Bank' },
    { name: 'US Manufacturing ERP', pipeline: Pipeline.ALL_PRODUCTS, stage: DealStage.LEAD, amountType: AmountType.FIXED, amountTotal: 200000, probability: 10, closeDate: daysFromNow(150), source: LeadSource.COLD_CALL, regionTags: ['US'], ownerId: john.id, company: 'US Manufacturing Inc' },
    { name: 'London Finance Analytics', pipeline: Pipeline.ALL_PRODUCTS, stage: DealStage.PROPOSAL, amountType: AmountType.RETAINER, amountTotal: 54000, probability: 55, closeDate: daysFromNow(40), source: LeadSource.WEBSITE, regionTags: ['UK'], ownerId: emily.id, company: 'London Finance Group' },
    // Staffing Pipeline
    { name: 'TechFlow Dev Team Augmentation', pipeline: Pipeline.STAFFING, stage: DealStage.NEGOTIATION, amountType: AmountType.HOURLY, hourlyRate: 95, expectedHours: 2000, amountTotal: 190000, probability: 80, closeDate: daysFromNow(10), source: LeadSource.WEBSITE, regionTags: ['US'], ownerId: john.id, company: 'TechFlow Inc' },
    { name: 'MediTech QA Team', pipeline: Pipeline.STAFFING, stage: DealStage.CLOSED_WON, amountType: AmountType.HOURLY, hourlyRate: 65, expectedHours: 1500, amountTotal: 97500, probability: 100, closeDate: daysAgo(5), source: LeadSource.LINKEDIN, regionTags: ['UK'], ownerId: emily.id, company: 'MediTech Solutions' },
    { name: 'EuroTech Project Management', pipeline: Pipeline.STAFFING, stage: DealStage.PROPOSAL, amountType: AmountType.HOURLY, hourlyRate: 85, expectedHours: 800, amountTotal: 68000, probability: 60, closeDate: daysFromNow(35), source: LeadSource.WEBSITE, regionTags: ['EU'], ownerId: john.id, company: 'EuroTech GmbH' },
    { name: 'Gulf Energy DevOps Support', pipeline: Pipeline.STAFFING, stage: DealStage.DISCOVERY, amountType: AmountType.HOURLY, hourlyRate: 90, expectedHours: 1200, amountTotal: 108000, probability: 45, closeDate: daysFromNow(65), source: LeadSource.REFERRAL, regionTags: ['ME'], ownerId: emily.id, company: 'Gulf Energy Systems' },
    { name: 'Irish Software Dev Team', pipeline: Pipeline.STAFFING, stage: DealStage.QUALIFIED, amountType: AmountType.HOURLY, hourlyRate: 95, expectedHours: 3000, amountTotal: 285000, probability: 35, closeDate: daysFromNow(85), source: LeadSource.REFERRAL, regionTags: ['UK', 'EU'], ownerId: john.id, company: 'Irish Software Ltd' },
    { name: 'Latino Bank IT Staff', pipeline: Pipeline.STAFFING, stage: DealStage.CLOSED_LOST, amountType: AmountType.HOURLY, hourlyRate: 75, expectedHours: 1000, amountTotal: 75000, probability: 0, closeDate: daysAgo(20), source: LeadSource.REFERRAL, regionTags: ['US'], ownerId: emily.id, company: 'Latino Bank' },
    { name: 'German Auto Engineering Team', pipeline: Pipeline.STAFFING, stage: DealStage.LEAD, amountType: AmountType.HOURLY, hourlyRate: 110, expectedHours: 2500, amountTotal: 275000, probability: 15, closeDate: daysFromNow(130), source: LeadSource.LINKEDIN, regionTags: ['EU'], ownerId: john.id, company: 'German Auto Works' },
    { name: 'Fashion Forward Tech Support', pipeline: Pipeline.STAFFING, stage: DealStage.DISCOVERY, amountType: AmountType.HOURLY, hourlyRate: 55, expectedHours: 500, amountTotal: 27500, probability: 40, closeDate: daysFromNow(55), source: LeadSource.WEBSITE, regionTags: ['US', 'UK'], ownerId: emily.id, company: 'Fashion Forward' },
    { name: 'Nordic Bank Security Team', pipeline: Pipeline.STAFFING, stage: DealStage.PROPOSAL, amountType: AmountType.HOURLY, hourlyRate: 100, expectedHours: 1800, amountTotal: 180000, probability: 65, closeDate: daysFromNow(25), source: LeadSource.LINKEDIN, regionTags: ['EU'], ownerId: john.id, company: 'Nordic Bank' },
  ];

  const deals = await Promise.all(
    dealData.map((data) =>
      prisma.deal.create({
        data: {
          ...data,
          createdAt: randomDate(daysAgo(60), daysAgo(1)),
        },
      })
    )
  );
  console.log(`  ✓ Created ${deals.length} deals`);

  // Convert some leads to deals (link them)
  console.log('🔗 Linking converted leads to deals...');
  const leadsToConvert = [
    { leadIndex: 2, dealIndex: 2 },  // James Wilson -> MediTech Security
    { leadIndex: 5, dealIndex: 5 },  // Sarah Ahmed -> Gulf Energy
    { leadIndex: 10, dealIndex: 8 }, // Peter Schmidt -> German Auto (lost)
    { leadIndex: 19, dealIndex: 15 }, // Emma Davis -> London Finance
  ];

  for (const { leadIndex, dealIndex } of leadsToConvert) {
    await prisma.lead.update({
      where: { id: leads[leadIndex].id },
      data: {
        isConverted: true,
        convertedToDealId: deals[dealIndex].id,
      },
    });
    await prisma.deal.update({
      where: { id: deals[dealIndex].id },
      data: {
        convertedFromLeadId: leads[leadIndex].id,
      },
    });
  }
  console.log(`  ✓ Linked ${leadsToConvert.length} leads to deals`);

  // ============ LINE ITEMS ============
  console.log('📋 Creating deal line items...');
  const lineItemsData: Array<{
    dealIndex: number;
    productIndex: number;
    quantity: number;
    discount: number;
  }> = [
    // TechFlow Cloud Migration
    { dealIndex: 0, productIndex: 0, quantity: 1, discount: 0 },    // Cloud Infrastructure
    { dealIndex: 0, productIndex: 1, quantity: 12, discount: 0.1 }, // Managed IT Support
    { dealIndex: 0, productIndex: 2, quantity: 1, discount: 0 },    // Security Audit
    // Global Retail IT Modernization
    { dealIndex: 1, productIndex: 0, quantity: 2, discount: 0.15 },
    { dealIndex: 1, productIndex: 3, quantity: 1, discount: 0 },
    { dealIndex: 1, productIndex: 1, quantity: 24, discount: 0.2 },
    // MediTech Security Overhaul
    { dealIndex: 2, productIndex: 2, quantity: 1, discount: 0 },
    { dealIndex: 2, productIndex: 13, quantity: 1, discount: 0 },
    // EuroTech Network Upgrade (closed won)
    { dealIndex: 4, productIndex: 3, quantity: 1, discount: 0 },
    { dealIndex: 4, productIndex: 0, quantity: 1, discount: 0.1 },
    // Gulf Energy Digital Transform
    { dealIndex: 5, productIndex: 0, quantity: 3, discount: 0.2 },
    { dealIndex: 5, productIndex: 1, quantity: 36, discount: 0.25 },
    { dealIndex: 5, productIndex: 2, quantity: 2, discount: 0.1 },
    // Fashion Forward CRM
    { dealIndex: 9, productIndex: 4, quantity: 50, discount: 0.3 },
    { dealIndex: 9, productIndex: 6, quantity: 20, discount: 0.2 },
    // Dubai Tech ERP
    { dealIndex: 10, productIndex: 5, quantity: 1, discount: 0 },
    { dealIndex: 10, productIndex: 14, quantity: 3, discount: 0 },
    // Nordic Bank Security (closed won)
    { dealIndex: 13, productIndex: 2, quantity: 2, discount: 0.15 },
    { dealIndex: 13, productIndex: 13, quantity: 1, discount: 0 },
    // London Finance Analytics
    { dealIndex: 15, productIndex: 6, quantity: 30, discount: 0.25 },
    { dealIndex: 15, productIndex: 7, quantity: 100, discount: 0.3 },
    // MediTech QA Team (closed won)
    { dealIndex: 17, productIndex: 10, quantity: 1500, discount: 0 },
    // EuroTech Project Management
    { dealIndex: 18, productIndex: 9, quantity: 800, discount: 0.05 },
    // Nordic Bank Security Team
    { dealIndex: 24, productIndex: 8, quantity: 1000, discount: 0.1 },
    { dealIndex: 24, productIndex: 11, quantity: 800, discount: 0.1 },
  ];

  const lineItems = await Promise.all(
    lineItemsData.map(({ dealIndex, productIndex, quantity, discount }) => {
      const product = products[productIndex];
      const unitPrice = product.unitPrice;
      const total = quantity * unitPrice * (1 - discount);
      return prisma.dealLineItem.create({
        data: {
          dealId: deals[dealIndex].id,
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice,
          discount,
          type: product.type,
          total,
          createdById: deals[dealIndex].ownerId,
        },
      });
    })
  );
  console.log(`  ✓ Created ${lineItems.length} line items`);

  // ============ ACTIVITIES ============
  console.log('📝 Creating activities...');
  const activitySubjects = {
    NOTE: ['Initial assessment', 'Budget discussion notes', 'Technical requirements', 'Stakeholder feedback', 'Competitive analysis', 'Follow-up notes'],
    CALL: ['Discovery call', 'Follow-up call', 'Pricing discussion', 'Technical review call', 'Executive briefing', 'Status update call'],
    MEETING: ['Kickoff meeting', 'Demo presentation', 'Proposal review', 'Contract negotiation', 'Technical workshop', 'Quarterly review'],
    EMAIL: ['Introduction email', 'Proposal sent', 'Quote follow-up', 'Meeting recap', 'Contract draft', 'Thank you note'],
  };

  const activitiesData: Array<{
    type: ActivityType;
    leadId?: string;
    dealId?: string;
    userId: string;
    daysAgo: number;
  }> = [];

  // Add activities for leads
  for (let i = 0; i < leads.length; i++) {
    const numActivities = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numActivities; j++) {
      const type = randomItem([ActivityType.NOTE, ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING]);
      activitiesData.push({
        type,
        leadId: leads[i].id,
        userId: leads[i].ownerId,
        daysAgo: Math.floor(Math.random() * 60) + 1,
      });
    }
  }

  // Add activities for deals (more activities)
  for (let i = 0; i < deals.length; i++) {
    const numActivities = Math.floor(Math.random() * 4) + 2;
    for (let j = 0; j < numActivities; j++) {
      const type = randomItem([ActivityType.NOTE, ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING]);
      activitiesData.push({
        type,
        dealId: deals[i].id,
        userId: deals[i].ownerId,
        daysAgo: Math.floor(Math.random() * 45) + 1,
      });
    }
  }

  const activities = await Promise.all(
    activitiesData.map(({ type, leadId, dealId, userId, daysAgo: daysAgoVal }) => {
      const subjects = activitySubjects[type];
      return prisma.activity.create({
        data: {
          type,
          subject: randomItem(subjects),
          description: `Activity notes and details for this ${type.toLowerCase()}. This contains relevant information about the interaction.`,
          leadId,
          dealId,
          userId,
          createdAt: daysAgo(daysAgoVal),
        },
      });
    })
  );
  console.log(`  ✓ Created ${activities.length} activities`);

  // ============ TASKS ============
  console.log('✅ Creating tasks...');
  const taskTitles = [
    'Send follow-up email',
    'Prepare proposal document',
    'Schedule demo meeting',
    'Review contract terms',
    'Update CRM records',
    'Call for status update',
    'Prepare presentation slides',
    'Collect technical requirements',
    'Send pricing quote',
    'Coordinate with legal team',
    'Prepare ROI analysis',
    'Schedule executive meeting',
  ];

  const tasksData: Array<{
    title: string;
    leadId?: string;
    dealId?: string;
    userId: string;
    completed: boolean;
    dueDaysFromNow: number;
  }> = [];

  // Tasks for leads
  for (let i = 0; i < leads.length; i++) {
    if (Math.random() > 0.4) {
      const numTasks = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numTasks; j++) {
        tasksData.push({
          title: randomItem(taskTitles),
          leadId: leads[i].id,
          userId: leads[i].ownerId,
          completed: Math.random() > 0.6,
          dueDaysFromNow: Math.floor(Math.random() * 30) - 10,
        });
      }
    }
  }

  // Tasks for deals
  for (let i = 0; i < deals.length; i++) {
    const numTasks = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numTasks; j++) {
      tasksData.push({
        title: randomItem(taskTitles),
        dealId: deals[i].id,
        userId: deals[i].ownerId,
        completed: Math.random() > 0.5,
        dueDaysFromNow: Math.floor(Math.random() * 45) - 15,
      });
    }
  }

  const tasks = await Promise.all(
    tasksData.map(({ title, leadId, dealId, userId, completed, dueDaysFromNow }) =>
      prisma.task.create({
        data: {
          title,
          description: `Task details: ${title}`,
          leadId,
          dealId,
          userId,
          completed,
          dueDate: dueDaysFromNow >= 0 ? daysFromNow(dueDaysFromNow) : daysAgo(-dueDaysFromNow),
          createdAt: daysAgo(Math.floor(Math.random() * 30) + 1),
        },
      })
    )
  );
  console.log(`  ✓ Created ${tasks.length} tasks`);

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Leads: ${leads.length} (${leadsToConvert.length} converted)`);
  console.log(`   Deals: ${deals.length}`);
  console.log(`   Line Items: ${lineItems.length}`);
  console.log(`   Activities: ${activities.length}`);
  console.log(`   Tasks: ${tasks.length}`);
  console.log('\n🔐 Login credentials:');
  console.log('   Admin: admin@forge.com / password123');
  console.log('   Sales: john@forge.com / password123');
  console.log('   Sales: emily@forge.com / password123');
  console.log('   Marketing: mike@forge.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
