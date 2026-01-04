interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
}

export default function StepProgress({ currentStep, totalSteps, stepTitles }: StepProgressProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Progress bar */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10" />

        {/* Progress line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-cyan-500 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {/* Step dots */}
        <div className="relative flex justify-between">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-300
                    ${isCompleted
                      ? 'bg-cyan-500 text-white'
                      : isCurrent
                        ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
                        : 'bg-white/10 text-white/40'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>

                {/* Step title - hidden on mobile, shown on larger screens */}
                {stepTitles && stepTitles[i] && (
                  <span
                    className={`
                      hidden sm:block mt-2 text-xs text-center max-w-[80px]
                      ${isCurrent ? 'text-cyan-400' : isCompleted ? 'text-white/70' : 'text-white/40'}
                    `}
                  >
                    {stepTitles[i]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step indicator for mobile */}
      <p className="sm:hidden text-center text-sm text-white/50 mt-4">
        Step {currentStep} of {totalSteps}
        {stepTitles && stepTitles[currentStep - 1] && (
          <span className="text-cyan-400 ml-1">- {stepTitles[currentStep - 1]}</span>
        )}
      </p>
    </div>
  );
}
