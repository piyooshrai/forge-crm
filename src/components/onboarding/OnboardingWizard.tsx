'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import StepProgress from './StepProgress';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface OnboardingWizardProps {
  role: 'SALES_REP' | 'MARKETING_REP' | 'SUPER_ADMIN';
  initialStep: number;
  totalSteps: number;
  stepTitles: string[];
  children: (props: {
    currentStep: number;
    onNext: () => void;
    onBack: () => void;
    setStepData: (data: any) => void;
    stepData: Record<string, any>;
  }) => ReactNode;
}

export default function OnboardingWizard({
  role,
  initialStep,
  totalSteps,
  stepTitles,
  children,
}: OnboardingWizardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(initialStep || 1);
  const [stepData, setStepDataState] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save progress when step changes
  useEffect(() => {
    if (currentStep > 1) {
      fetch('/api/onboarding/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: currentStep }),
      }).catch(console.error);
    }
  }, [currentStep]);

  const setStepData = (data: any) => {
    setStepDataState(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkip = async () => {
    // Save current progress and redirect to appropriate page
    try {
      await fetch('/api/onboarding/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: currentStep }),
      });

      showToast('You can resume onboarding anytime from your dashboard', 'info');

      // Redirect based on role
      const redirectPath = role === 'SALES_REP'
        ? '/deals'
        : role === 'MARKETING_REP'
          ? '/marketing/tasks'
          : '/dashboard';

      router.push(redirectPath);
    } catch (error) {
      showToast('Failed to save progress', 'error');
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      showToast('Welcome to The Algorithm\'s Forge!', 'success');
      router.push(data.redirectTo);
    } catch (error: any) {
      showToast(error.message || 'Failed to complete onboarding', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      {/* Progress indicator */}
      <StepProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitles={stepTitles}
      />

      {/* Step content */}
      <GlassCard variant="primary" className="p-6 sm:p-8">
        {children({
          currentStep,
          onNext: handleNext,
          onBack: handleBack,
          setStepData,
          stepData,
        })}
      </GlassCard>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {currentStep > 1 && (
            <Button variant="secondary" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            Skip for now
          </button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? 'Completing...' : 'Get Started'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
