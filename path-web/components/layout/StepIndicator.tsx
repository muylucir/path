import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-6">
      {/* Mobile: Compact view */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Step {currentStep} / {steps.length}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {steps[currentStep - 1]}
          </span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <span
              key={index}
              className={`text-xs ${
                index + 1 <= currentStep ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Desktop: Full view */}
      <div className="hidden md:block">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div key={index} className="flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                      isCompleted
                        ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
                        : isCurrent
                        ? "bg-gradient-to-br from-primary to-accent text-primary-foreground ring-4 ring-primary/20 shadow-lg shadow-primary/30 scale-110"
                        : "bg-muted text-muted-foreground border-2 border-muted-foreground/20"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <p
                    className={`mt-3 text-sm font-semibold transition-colors ${
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </p>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="relative w-20 lg:w-32 h-1 mx-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out ${
                        isCompleted ? "w-full" : "w-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
