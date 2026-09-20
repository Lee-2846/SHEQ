import { Check, Clock } from "lucide-react";

const STEPS = [
  { key: "Submitted", label: "Submitted" },
  { key: "Under Review", label: "Under Review" },
  { key: "Verified", label: "Verified" },
  { key: "Resolved", label: "Resolved" }
];

export default function StatusStepper({ currentStatus = "Submitted" }) {
  const normalizedStatus =
    currentStatus === "Under review" ? "Under Review" : currentStatus;

  const currentIndex = STEPS.findIndex(s => s.key === normalizedStatus);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="status-stepper">
      <div className="stepper-track">
        {STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div
              key={step.key}
              className={`stepper-step ${
                isDone ? "step-done" : isCurrent ? "step-current" : "step-pending"
              }`}
            >
              <div className="step-circle">
                {isDone ? (
                  <Check size={14} />
                ) : isCurrent ? (
                  <Clock size={14} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="step-label">{step.label}</span>
              {idx < STEPS.length - 1 && <div className="step-connector" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
