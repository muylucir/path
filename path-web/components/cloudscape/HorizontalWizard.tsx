"use client";

import { type ReactNode } from "react";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

export interface HorizontalWizardStep {
  title: string;
  description?: string;
  content: ReactNode;
}

interface HorizontalWizardProps {
  steps: HorizontalWizardStep[];
  activeStepIndex: number;
  isLoadingNextStep?: boolean;
  onNavigate: (detail: { detail: { requestedStepIndex: number; reason: string } }) => void;
  onCancel: () => void;
  onSubmit: () => void;
  i18nStrings?: {
    cancelButton?: string;
    previousButton?: string;
    nextButton?: string;
    submitButton?: string;
  };
}

export function HorizontalWizard({
  steps,
  activeStepIndex,
  isLoadingNextStep,
  onNavigate,
  onCancel,
  onSubmit,
  i18nStrings,
}: HorizontalWizardProps) {
  const isLastStep = activeStepIndex === steps.length - 1;
  const isFirstStep = activeStepIndex === 0;

  const handleStepClick = (index: number) => {
    if (index < activeStepIndex) {
      onNavigate({ detail: { requestedStepIndex: index, reason: "step" } });
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onNavigate({ detail: { requestedStepIndex: activeStepIndex - 1, reason: "previous" } });
    }
  };

  const handleNext = () => {
    onNavigate({ detail: { requestedStepIndex: activeStepIndex + 1, reason: "next" } });
  };

  return (
    <div className="horizontal-wizard">
      {/* Step indicator bar */}
      <div className="horizontal-wizard-nav">
        {steps.map((step, index) => {
          const isActive = index === activeStepIndex;
          const isCompleted = index < activeStepIndex;
          const isClickable = isCompleted;

          return (
            <div key={index} className="horizontal-wizard-step-wrapper">
              <button
                type="button"
                className={[
                  "horizontal-wizard-step",
                  isActive && "active",
                  isCompleted && "completed",
                  isClickable && "clickable",
                ].filter(Boolean).join(" ")}
                onClick={() => isClickable && handleStepClick(index)}
                disabled={!isClickable}
              >
                <span className="horizontal-wizard-step-number">
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.354 4.354l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 01.708-.708L6 10.293l6.646-6.647a.5.5 0 01.708.708z" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="horizontal-wizard-step-label">
                  <span className="horizontal-wizard-step-title">{step.title}</span>
                  {step.description && (
                    <span className="horizontal-wizard-step-desc">{step.description}</span>
                  )}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={`horizontal-wizard-connector ${isCompleted ? "completed" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="horizontal-wizard-content">
        {steps[activeStepIndex]?.content}
      </div>

      {/* Action buttons */}
      <div className="horizontal-wizard-actions">
        <Box float="left">
          <Button variant="link" onClick={onCancel}>
            {i18nStrings?.cancelButton || "Cancel"}
          </Button>
        </Box>
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            {!isFirstStep && (
              <Button onClick={handlePrevious} disabled={isLoadingNextStep}>
                {i18nStrings?.previousButton || "Previous"}
              </Button>
            )}
            {isLastStep ? (
              <Button variant="primary" onClick={onSubmit} loading={isLoadingNextStep}>
                {i18nStrings?.submitButton || "Submit"}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext} loading={isLoadingNextStep}>
                {i18nStrings?.nextButton || "Next"}
              </Button>
            )}
          </SpaceBetween>
        </Box>
      </div>
    </div>
  );
}
