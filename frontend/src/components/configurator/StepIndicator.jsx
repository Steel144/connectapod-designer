import React from "react";
import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Select Design", short: "Design" },
  { id: 2, label: "Customise", short: "Customise" },
  { id: 3, label: "Elevations", short: "Elevations" },
  { id: 4, label: "Site Map", short: "Site" },
  { id: 5, label: "Save Details", short: "Save" },
  { id: 6, label: "Share & Print", short: "Share" },
];

export default function StepIndicator({ currentStep = 1, completedSteps = [], onStepClick }) {
  return (
    <div className="w-full bg-gray-50 border-b border-gray-200 px-4 py-1.5 flex items-center gap-0 overflow-x-auto" data-testid="step-indicator">
      {STEPS.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);
        const isPast = step.id < currentStep;
        const isClickable = isCompleted || isPast || step.id <= currentStep;

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => isClickable && onStepClick?.(step.id)}
              data-testid={`step-${step.id}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "text-[#F15A22] font-bold"
                  : isCompleted || isPast
                  ? "text-gray-500 hover:text-[#F15A22] cursor-pointer"
                  : "text-gray-300 cursor-default"
              }`}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border-2 flex-shrink-0 transition-all ${
                  isActive
                    ? "border-[#F15A22] bg-[#F15A22] text-white"
                    : isCompleted || isPast
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 text-gray-300"
                }`}
                style={{ borderRadius: "50%" }}
              >
                {isCompleted || isPast ? <Check size={10} strokeWidth={3} /> : step.id}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.short}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-shrink-0 h-px w-4 sm:w-8 transition-all ${
                  (isCompleted || isPast) ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export { STEPS };
