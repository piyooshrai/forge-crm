import SectionHeader from '@/components/SectionHeader';
import ProductsList from './ProductsList';
import NewProductButton from './NewProductButton';

// Mock data for UI demo
const mockProducts = [
  {
    id: '1',
    name: 'Cloud Infrastructure Setup',
    description: 'Complete cloud migration and setup service',
    sku: 'CLOUD-001',
    price: 50000,
    isRecurring: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Monthly Support Package',
    description: '24/7 technical support and maintenance',
    sku: 'SUPPORT-MONTHLY',
    price: 5000,
    isRecurring: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '3',
    name: 'Custom Software Development',
    description: 'Bespoke software development services',
    sku: 'DEV-CUSTOM',
    price: 150000,
    isRecurring: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
];

export default function ProductsPage() {
  const products = mockProducts;

  return (
    <div className="mx-auto max-w-[1920px] px-6 py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader title="Products" />
        <NewProductButton />
      </div>

      <ProductsList products={products} />
    </div>
  );
}

