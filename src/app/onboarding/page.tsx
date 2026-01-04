'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

// Sales Rep Steps
import SalesWelcomeStep from '@/components/onboarding/steps/sales/WelcomeStep';
import CreateDealStep from '@/components/onboarding/steps/sales/CreateDealStep';
import LogActivityStep from '@/components/onboarding/steps/sales/LogActivityStep';
import AlertsInfoStep from '@/components/onboarding/steps/sales/AlertsInfoStep';
import SalesSummaryStep from '@/components/onboarding/steps/sales/SummaryStep';

// Marketing Rep Steps
import MarketingWelcomeStep from '@/components/onboarding/steps/marketing/WelcomeStep';
import CreateLeadStep from '@/components/onboarding/steps/marketing/CreateLeadStep';
import LogTaskStep from '@/components/onboarding/steps/marketing/LogTaskStep';
import OutcomeStep from '@/components/onboarding/steps/marketing/OutcomeStep';
import MarketingSummaryStep from '@/components/onboarding/steps/marketing/SummaryStep';

// Admin Steps
import AdminOverviewStep from '@/components/onboarding/steps/admin/OverviewStep';
import AdminDashboardStep from '@/components/onboarding/steps/admin/DashboardStep';

type Role = 'SALES_REP' | 'MARKETING_REP' | 'SUPER_ADMIN';

interface OnboardingStatus {
  completed: boolean;
  step: number;
  totalSteps: number;
  role: Role;
  name: string;
  monthlyQuota: number;
}

const STEP_TITLES: Record<Role, string[]> = {
  SALES_REP: ['Welcome', 'Create Deal', 'Log Activity', 'Alerts', 'Summary'],
  MARKETING_REP: ['Welcome', 'Create Lead', 'Log Task', 'Outcome', 'Summary'],
  SUPER_ADMIN: ['Overview', 'Dashboard'],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/onboarding');
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(data.error || 'Failed to fetch onboarding status');
        }

        // If already completed, redirect to role-appropriate page
        if (data.completed) {
          const redirectPath =
            data.role === 'SALES_REP'
              ? '/deals'
              : data.role === 'MARKETING_REP'
                ? '/marketing/tasks'
                : '/dashboard';
          router.push(redirectPath);
          return;
        }

        setStatus(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const { role, step, totalSteps, monthlyQuota } = status;
  const stepTitles = STEP_TITLES[role];

  return (
    <OnboardingWizard
      role={role}
      initialStep={step > 0 ? step : 1}
      totalSteps={totalSteps}
      stepTitles={stepTitles}
    >
      {({ currentStep, onNext, onBack, setStepData, stepData }) => {
        // Sales Rep Steps
        if (role === 'SALES_REP') {
          switch (currentStep) {
            case 1:
              return <SalesWelcomeStep monthlyQuota={monthlyQuota || 3000} onNext={onNext} />;
            case 2:
              return <CreateDealStep onNext={onNext} setStepData={setStepData} />;
            case 3:
              return <LogActivityStep onNext={onNext} stepData={stepData} />;
            case 4:
              return <AlertsInfoStep onNext={onNext} />;
            case 5:
              return <SalesSummaryStep stepData={stepData} monthlyQuota={monthlyQuota || 3000} />;
            default:
              return null;
          }
        }

        // Marketing Rep Steps
        if (role === 'MARKETING_REP') {
          switch (currentStep) {
            case 1:
              return <MarketingWelcomeStep onNext={onNext} />;
            case 2:
              return <CreateLeadStep onNext={onNext} setStepData={setStepData} />;
            case 3:
              return <LogTaskStep onNext={onNext} setStepData={setStepData} stepData={stepData} />;
            case 4:
              return <OutcomeStep onNext={onNext} stepData={stepData} />;
            case 5:
              return <MarketingSummaryStep stepData={stepData} />;
            default:
              return null;
          }
        }

        // Super Admin Steps
        if (role === 'SUPER_ADMIN') {
          switch (currentStep) {
            case 1:
              return <AdminOverviewStep onNext={onNext} />;
            case 2:
              return <AdminDashboardStep stepData={stepData} />;
            default:
              return null;
          }
        }

        return null;
      }}
    </OnboardingWizard>
  );
}
