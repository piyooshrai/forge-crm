// Mock User
export const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@forge.com',
  role: 'SUPER_ADMIN' as const,
  avatar: null,
};

// Lead Statuses
export const leadStatuses = ['New', 'Contacted', 'Qualified', 'Unqualified'] as const;
export type LeadStatus = typeof leadStatuses[number];

// Lead Sources
export const leadSources = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show', 'Email Campaign', 'Upwork', 'Guru', 'Freelancer', 'Other'] as const;
export type LeadSource = typeof leadSources[number];

// Regions
export const regions = ['US', 'UK', 'EU', 'ME', 'APAC', 'LATAM'] as const;
export type Region = typeof regions[number];

// Pipelines
export const pipelines = ['IT_SERVICES', 'ALL_PRODUCTS', 'STAFFING'] as const;
export type Pipeline = typeof pipelines[number];

export const pipelineLabels: Record<Pipeline, string> = {
  IT_SERVICES: 'IT Services',
  ALL_PRODUCTS: 'All Products',
  STAFFING: 'Staffing',
};

// Deal Stages
export const dealStages = ['LEAD', 'QUALIFIED', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'] as const;
export type DealStage = typeof dealStages[number];

export const stageLabels: Record<DealStage, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Qualified',
  DISCOVERY: 'Discovery',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

export const stageProbabilities: Record<DealStage, number> = {
  LEAD: 10,
  QUALIFIED: 25,
  DISCOVERY: 40,
  PROPOSAL: 60,
  NEGOTIATION: 80,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
};

// Amount Types
export const amountTypes = ['FIXED', 'HOURLY', 'RETAINER'] as const;
export type AmountType = typeof amountTypes[number];

// Activity Types
export const activityTypes = ['NOTE', 'CALL', 'MEETING', 'EMAIL'] as const;
export type ActivityType = typeof activityTypes[number];

// Mock Leads
export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: LeadSource;
  status: LeadStatus;
  regionTags: Region[];
  owner: { name: string; email: string };
  createdAt: Date;
  notes?: string;
  convertedToDealId?: string;
}

export const mockLeads: Lead[] = [
  { id: '1', companyName: 'Acme Corporation', contactName: 'John Smith', contactEmail: 'john@acme.com', contactPhone: '+1 555-0101', source: 'Website', status: 'Qualified', regionTags: ['US'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-01') },
  { id: '2', companyName: 'TechStart Inc', contactName: 'Sarah Johnson', contactEmail: 'sarah@techstart.com', contactPhone: '+1 555-0102', source: 'Referral', status: 'New', regionTags: ['US', 'EU'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-05') },
  { id: '3', companyName: 'Global Solutions Ltd', contactName: 'Michael Brown', contactEmail: 'michael@globalsol.co.uk', contactPhone: '+44 20 7946 0958', source: 'LinkedIn', status: 'Contacted', regionTags: ['UK', 'EU'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-08') },
  { id: '4', companyName: 'Dubai Innovations', contactName: 'Ahmed Hassan', contactEmail: 'ahmed@dubainnov.ae', contactPhone: '+971 4 123 4567', source: 'Trade Show', status: 'Qualified', regionTags: ['ME'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-10') },
  { id: '5', companyName: 'Nordic Systems AB', contactName: 'Erik Lindqvist', contactEmail: 'erik@nordicsys.se', contactPhone: '+46 8 123 456 78', source: 'Cold Call', status: 'New', regionTags: ['EU'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-12') },
  { id: '6', companyName: 'Pacific Ventures', contactName: 'Lisa Chen', contactEmail: 'lisa@pacificv.com', contactPhone: '+1 555-0103', source: 'Email Campaign', status: 'Contacted', regionTags: ['APAC', 'US'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-14') },
  { id: '7', companyName: 'Berlin Digital GmbH', contactName: 'Hans Mueller', contactEmail: 'hans@berlindig.de', contactPhone: '+49 30 12345678', source: 'Website', status: 'Qualified', regionTags: ['EU'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-15') },
  { id: '8', companyName: 'Sunrise Technologies', contactName: 'Priya Patel', contactEmail: 'priya@sunrisetech.in', contactPhone: '+91 22 1234 5678', source: 'Referral', status: 'Unqualified', regionTags: ['APAC'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-16') },
  { id: '9', companyName: 'Madrid Consulting', contactName: 'Carlos Garcia', contactEmail: 'carlos@madridcons.es', contactPhone: '+34 91 123 4567', source: 'LinkedIn', status: 'New', regionTags: ['EU'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-17') },
  { id: '10', companyName: 'Sydney Enterprises', contactName: 'James Wilson', contactEmail: 'james@sydneyent.com.au', contactPhone: '+61 2 1234 5678', source: 'Trade Show', status: 'Contacted', regionTags: ['APAC'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-18') },
  { id: '11', companyName: 'Toronto Financial', contactName: 'Emma Thompson', contactEmail: 'emma@torontofin.ca', contactPhone: '+1 416-555-0104', source: 'Website', status: 'Qualified', regionTags: ['US'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-19') },
  { id: '12', companyName: 'Singapore Tech Hub', contactName: 'Wei Lim', contactEmail: 'wei@sgtechhub.sg', contactPhone: '+65 6123 4567', source: 'Cold Call', status: 'New', regionTags: ['APAC'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-20') },
  { id: '13', companyName: 'Amsterdam Digital', contactName: 'Jan de Vries', contactEmail: 'jan@amsterdamdig.nl', contactPhone: '+31 20 123 4567', source: 'Email Campaign', status: 'Contacted', regionTags: ['EU'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-21') },
  { id: '14', companyName: 'Riyadh Solutions', contactName: 'Khalid Al-Rashid', contactEmail: 'khalid@riyadhsol.sa', contactPhone: '+966 11 123 4567', source: 'Referral', status: 'Qualified', regionTags: ['ME'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-22') },
  { id: '15', companyName: 'Sao Paulo Dynamics', contactName: 'Ana Silva', contactEmail: 'ana@spdynamics.br', contactPhone: '+55 11 1234-5678', source: 'LinkedIn', status: 'New', regionTags: ['LATAM'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-23') },
  { id: '16', companyName: 'Mexico City Innovate', contactName: 'Roberto Martinez', contactEmail: 'roberto@mxinnovate.mx', contactPhone: '+52 55 1234 5678', source: 'Website', status: 'Unqualified', regionTags: ['LATAM'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-24') },
  { id: '17', companyName: 'Chicago Manufacturing', contactName: 'David Anderson', contactEmail: 'david@chicagomfg.com', contactPhone: '+1 312-555-0105', source: 'Trade Show', status: 'Contacted', regionTags: ['US'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-25') },
  { id: '18', companyName: 'Paris Luxe Group', contactName: 'Marie Dubois', contactEmail: 'marie@parisluxe.fr', contactPhone: '+33 1 23 45 67 89', source: 'Referral', status: 'Qualified', regionTags: ['EU'], owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-26') },
];

// Mock Deals
export interface Deal {
  id: string;
  name: string;
  pipeline: Pipeline;
  stage: DealStage;
  probability: number;
  amountType: AmountType;
  amountTotal: number;
  hourlyRate?: number;
  expectedHours?: number;
  monthlyAmount?: number;
  closeDate: Date;
  owner: { name: string; email: string };
  createdAt: Date;
  leadId?: string;
}

export const mockDeals: Deal[] = [
  { id: '1', name: 'Acme Corp - Cloud Migration', pipeline: 'IT_SERVICES', stage: 'PROPOSAL', probability: 60, amountType: 'FIXED', amountTotal: 245000, closeDate: new Date('2025-02-15'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-11-10') },
  { id: '2', name: 'TechStart - DevOps Setup', pipeline: 'IT_SERVICES', stage: 'NEGOTIATION', probability: 80, amountType: 'HOURLY', amountTotal: 180000, hourlyRate: 150, expectedHours: 1200, closeDate: new Date('2025-01-28'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-11-15') },
  { id: '3', name: 'Global Solutions - Staffing Q1', pipeline: 'STAFFING', stage: 'QUALIFIED', probability: 25, amountType: 'RETAINER', amountTotal: 120000, monthlyAmount: 40000, closeDate: new Date('2025-03-10'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-11-20') },
  { id: '4', name: 'Dubai Innovations - ERP', pipeline: 'ALL_PRODUCTS', stage: 'DISCOVERY', probability: 40, amountType: 'FIXED', amountTotal: 520000, closeDate: new Date('2025-04-01'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-11-25') },
  { id: '5', name: 'Nordic Systems - Security Audit', pipeline: 'IT_SERVICES', stage: 'LEAD', probability: 10, amountType: 'FIXED', amountTotal: 75000, closeDate: new Date('2025-05-01'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-01') },
  { id: '6', name: 'Pacific Ventures - Data Platform', pipeline: 'ALL_PRODUCTS', stage: 'PROPOSAL', probability: 60, amountType: 'FIXED', amountTotal: 380000, closeDate: new Date('2025-02-28'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-05') },
  { id: '7', name: 'Berlin Digital - App Development', pipeline: 'IT_SERVICES', stage: 'CLOSED_WON', probability: 100, amountType: 'FIXED', amountTotal: 290000, closeDate: new Date('2024-12-20'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-10-01') },
  { id: '8', name: 'Sunrise Tech - IT Staffing', pipeline: 'STAFFING', stage: 'NEGOTIATION', probability: 80, amountType: 'RETAINER', amountTotal: 180000, monthlyAmount: 60000, closeDate: new Date('2025-01-15'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-11-01') },
  { id: '9', name: 'Madrid Consulting - CRM', pipeline: 'ALL_PRODUCTS', stage: 'QUALIFIED', probability: 25, amountType: 'FIXED', amountTotal: 95000, closeDate: new Date('2025-03-20'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-10') },
  { id: '10', name: 'Sydney Enterprises - Infrastructure', pipeline: 'IT_SERVICES', stage: 'DISCOVERY', probability: 40, amountType: 'HOURLY', amountTotal: 240000, hourlyRate: 200, expectedHours: 1200, closeDate: new Date('2025-04-15'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-12') },
  { id: '11', name: 'Toronto Financial - Compliance', pipeline: 'IT_SERVICES', stage: 'CLOSED_LOST', probability: 0, amountType: 'FIXED', amountTotal: 150000, closeDate: new Date('2024-12-01'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-09-15') },
  { id: '12', name: 'Singapore Tech - Developer Team', pipeline: 'STAFFING', stage: 'LEAD', probability: 10, amountType: 'RETAINER', amountTotal: 90000, monthlyAmount: 30000, closeDate: new Date('2025-06-01'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-15') },
  { id: '13', name: 'Amsterdam Digital - E-commerce', pipeline: 'ALL_PRODUCTS', stage: 'PROPOSAL', probability: 60, amountType: 'FIXED', amountTotal: 185000, closeDate: new Date('2025-02-10'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-01') },
  { id: '14', name: 'Riyadh Solutions - Digital Transform', pipeline: 'IT_SERVICES', stage: 'NEGOTIATION', probability: 80, amountType: 'FIXED', amountTotal: 450000, closeDate: new Date('2025-01-30'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-11-05') },
  { id: '15', name: 'Sao Paulo - Support Contract', pipeline: 'IT_SERVICES', stage: 'CLOSED_WON', probability: 100, amountType: 'RETAINER', amountTotal: 72000, monthlyAmount: 6000, closeDate: new Date('2024-12-15'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-10-20') },
  { id: '16', name: 'Mexico City - Hardware Upgrade', pipeline: 'ALL_PRODUCTS', stage: 'DISCOVERY', probability: 40, amountType: 'FIXED', amountTotal: 125000, closeDate: new Date('2025-03-15'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-18') },
  { id: '17', name: 'Chicago Mfg - IoT Platform', pipeline: 'IT_SERVICES', stage: 'QUALIFIED', probability: 25, amountType: 'FIXED', amountTotal: 310000, closeDate: new Date('2025-05-01'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-20') },
  { id: '18', name: 'Paris Luxe - Mobile App', pipeline: 'ALL_PRODUCTS', stage: 'LEAD', probability: 10, amountType: 'FIXED', amountTotal: 220000, closeDate: new Date('2025-06-15'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-22') },
  { id: '19', name: 'London Finance - BI Dashboard', pipeline: 'IT_SERVICES', stage: 'PROPOSAL', probability: 60, amountType: 'HOURLY', amountTotal: 160000, hourlyRate: 175, expectedHours: 915, closeDate: new Date('2025-02-20'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-08') },
  { id: '20', name: 'Tokyo Systems - Cloud Services', pipeline: 'IT_SERVICES', stage: 'CLOSED_WON', probability: 100, amountType: 'FIXED', amountTotal: 195000, closeDate: new Date('2024-12-10'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-09-01') },
  { id: '21', name: 'Mumbai Corp - Team Augmentation', pipeline: 'STAFFING', stage: 'DISCOVERY', probability: 40, amountType: 'RETAINER', amountTotal: 144000, monthlyAmount: 48000, closeDate: new Date('2025-04-01'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-14') },
  { id: '22', name: 'Seoul Tech - Security Suite', pipeline: 'ALL_PRODUCTS', stage: 'NEGOTIATION', probability: 80, amountType: 'FIXED', amountTotal: 275000, closeDate: new Date('2025-01-25'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-11-28') },
  { id: '23', name: 'Cairo Enterprises - Network', pipeline: 'IT_SERVICES', stage: 'QUALIFIED', probability: 25, amountType: 'FIXED', amountTotal: 85000, closeDate: new Date('2025-04-20'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-19') },
  { id: '24', name: 'Istanbul Digital - SaaS License', pipeline: 'ALL_PRODUCTS', stage: 'CLOSED_LOST', probability: 0, amountType: 'FIXED', amountTotal: 45000, closeDate: new Date('2024-11-30'), owner: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-08-15') },
];

// Mock Products
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  price: number;
  isRecurring: boolean;
  createdAt: Date;
}

export const mockProducts: Product[] = [
  { id: '1', name: 'Cloud Infrastructure Setup', description: 'Complete cloud migration and infrastructure setup including AWS/Azure/GCP configuration', category: 'IT Services', sku: 'CLOUD-001', price: 50000, isRecurring: false, createdAt: new Date('2024-01-01') },
  { id: '2', name: 'Monthly Support Package - Basic', description: '8x5 technical support and maintenance', category: 'IT Services', sku: 'SUPPORT-BASIC', price: 2500, isRecurring: true, createdAt: new Date('2024-01-05') },
  { id: '3', name: 'Monthly Support Package - Premium', description: '24/7 technical support with dedicated account manager', category: 'IT Services', sku: 'SUPPORT-PREM', price: 7500, isRecurring: true, createdAt: new Date('2024-01-05') },
  { id: '4', name: 'Custom Software Development', description: 'Bespoke software development services - per project', category: 'IT Services', sku: 'DEV-CUSTOM', price: 150000, isRecurring: false, createdAt: new Date('2024-01-10') },
  { id: '5', name: 'Security Audit & Assessment', description: 'Comprehensive security audit with penetration testing and recommendations', category: 'IT Services', sku: 'SEC-AUDIT', price: 25000, isRecurring: false, createdAt: new Date('2024-01-15') },
  { id: '6', name: 'CRM Platform License', description: 'Enterprise CRM software license - per user/month', category: 'SaaS Products', sku: 'CRM-LIC', price: 150, isRecurring: true, createdAt: new Date('2024-02-01') },
  { id: '7', name: 'ERP Suite License', description: 'Full ERP suite including finance, HR, and supply chain modules', category: 'SaaS Products', sku: 'ERP-SUITE', price: 500, isRecurring: true, createdAt: new Date('2024-02-10') },
  { id: '8', name: 'Data Analytics Platform', description: 'Business intelligence and data visualization platform', category: 'SaaS Products', sku: 'ANALYTICS', price: 200, isRecurring: true, createdAt: new Date('2024-02-15') },
  { id: '9', name: 'Senior Developer - Contract', description: 'Senior software developer staffing - monthly rate', category: 'Staffing', sku: 'STAFF-SR-DEV', price: 15000, isRecurring: true, createdAt: new Date('2024-03-01') },
  { id: '10', name: 'Project Manager - Contract', description: 'Experienced project manager - monthly rate', category: 'Staffing', sku: 'STAFF-PM', price: 12000, isRecurring: true, createdAt: new Date('2024-03-05') },
  { id: '11', name: 'DevOps Engineer - Contract', description: 'DevOps/SRE engineer staffing - monthly rate', category: 'Staffing', sku: 'STAFF-DEVOPS', price: 14000, isRecurring: true, createdAt: new Date('2024-03-10') },
  { id: '12', name: 'QA Engineer - Contract', description: 'Quality assurance engineer - monthly rate', category: 'Staffing', sku: 'STAFF-QA', price: 10000, isRecurring: true, createdAt: new Date('2024-03-15') },
  { id: '13', name: 'Hardware - Server Rack', description: 'Enterprise server rack with installation', category: 'Hardware', sku: 'HW-RACK', price: 35000, isRecurring: false, createdAt: new Date('2024-04-01') },
  { id: '14', name: 'Network Equipment Bundle', description: 'Switches, routers, and firewall setup', category: 'Hardware', sku: 'HW-NETWORK', price: 18000, isRecurring: false, createdAt: new Date('2024-04-10') },
  { id: '15', name: 'Training & Workshops', description: 'Technical training sessions - per day', category: 'Services', sku: 'TRAIN-DAY', price: 3500, isRecurring: false, createdAt: new Date('2024-05-01') },
];

// Mock Activities
export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  user: { name: string; email: string };
  createdAt: Date;
}

export const mockActivities: Activity[] = [
  { id: '1', type: 'CALL', description: 'Initial discovery call - discussed cloud migration requirements', user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-20T10:30:00') },
  { id: '2', type: 'EMAIL', description: 'Sent proposal document and pricing breakdown', user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-19T14:15:00') },
  { id: '3', type: 'MEETING', description: 'On-site meeting with IT director to review infrastructure', user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-18T09:00:00') },
  { id: '4', type: 'NOTE', description: 'Client mentioned budget approval expected by end of month', user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-17T16:45:00') },
  { id: '5', type: 'CALL', description: 'Follow-up call to address technical questions', user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-15T11:00:00') },
];

// Mock Tasks
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  user: { name: string; email: string };
  createdAt: Date;
}

const today = new Date();
const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

export const mockTasks: Task[] = [
  { id: '1', title: 'Send revised proposal', description: 'Update pricing based on new requirements', dueDate: twoDaysAgo, completed: false, user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-15') },
  { id: '2', title: 'Schedule demo call', description: 'Coordinate with tech team for live demo', dueDate: yesterday, completed: true, user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-16') },
  { id: '3', title: 'Follow up on contract', dueDate: today, completed: false, user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-18') },
  { id: '4', title: 'Prepare technical documentation', description: 'Create architecture diagrams for client review', dueDate: tomorrow, completed: false, user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-19') },
  { id: '5', title: 'Review legal terms', description: 'Go through MSA with legal team', dueDate: nextWeek, completed: false, user: { name: 'John Doe', email: 'john@forge.com' }, createdAt: new Date('2024-12-20') },
];

// Mock Line Items
export interface LineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  isRecurring: boolean;
}

export const mockLineItems: LineItem[] = [
  { id: '1', productId: '1', productName: 'Cloud Infrastructure Setup', quantity: 1, unitPrice: 50000, discount: 0, total: 50000, isRecurring: false },
  { id: '2', productId: '3', productName: 'Monthly Support Package - Premium', quantity: 12, unitPrice: 7500, discount: 10, total: 81000, isRecurring: true },
  { id: '3', productId: '9', productName: 'Senior Developer - Contract', quantity: 3, unitPrice: 15000, discount: 5, total: 42750, isRecurring: true },
];

// Helper to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper to format date
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

// Helper to format datetime
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

// Helper to check if date is overdue
export function isOverdue(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

// Helper to check if date is today
export function isToday(date: Date): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
}
