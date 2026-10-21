import { useId } from "react";
import {
  BadgeCheck,
  Check,
  FileCheck,
  HeartPulse,
  Landmark,
  ListChecks,
  Network,
  Rocket,
  Shield,
  ShoppingCart,
} from "lucide-react";

const OPTIONS = [
  { id: "healthcare", label: "Healthcare", Icon: HeartPulse },
  { id: "ecommerce", label: "Ecommerce", Icon: ShoppingCart },
  { id: "fintech", label: "Fintech", Icon: Landmark },
  { id: "defence", label: "Defence", Icon: Shield },
  { id: "startup", label: "Startup", Icon: Rocket },
  { id: "iso27001", label: "ISO27001", Icon: BadgeCheck },
  { id: "dora", label: "DORA", Icon: FileCheck },
  { id: "nis2", label: "NIS2", Icon: Network },
];

const OtherSpecificationsSection = ({
  selectedSpecifications,
  onSpecificationsChange,
}) => {
  const id = useId();

  return (
    <section className="p-6 rounded-2xl border bg-surface border-border">
      <div className="flex items-center mb-4">
        <ListChecks className="w-5 h-5 mr-2 text-accent" aria-hidden="true" />
        <h2 id={`${id}-heading`} className="text-sm font-semibold text-label">
          Other specifications:
        </h2>
      </div>
      <p className="text-sm font-semibold text-label mb-2">
        Industry / standard
      </p>
      <p id={`${id}-description`} className="text-xs text-tertiary mb-4">
        Choose industries or standards of interest.
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-heading`}
        aria-describedby={`${id}-description`}
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
      >
        {OPTIONS.map(({ id: optionId, label, Icon }) => {
          const selected = selectedSpecifications.includes(optionId);
          return (
            <button
              key={optionId}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onSpecificationsChange(
                  selected
                    ? selectedSpecifications.filter(
                        (value) => value !== optionId,
                      )
                    : [...selectedSpecifications, optionId],
                )
              }
              className={`relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                selected
                  ? "border-primary text-accent"
                  : "border-border text-secondary hover:border-primary/50 hover:text-primary"
              }`}
            >
              {selected && (
                <Check
                  className="absolute top-2 right-2 w-4 h-4"
                  aria-hidden="true"
                />
              )}
              <Icon className="w-7 h-7" aria-hidden="true" />
              <span className="text-sm font-bold">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default OtherSpecificationsSection;
