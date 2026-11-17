import { useId } from "react";
import {
  BadgeCheck,
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

// Roadmap only: nothing reads a selection yet, so the options render like the
// disabled providers (visible, never clickable) instead of pretending to work.
const OtherSpecificationsSection = () => {
  const id = useId();

  return (
    <div className="p-6 rounded-2xl border bg-surface border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ListChecks className="w-5 h-5 mr-2 text-accent" aria-hidden="true" />
          <label
            id={`${id}-heading`}
            className="text-sm font-semibold text-label"
          >
            Other specifications
          </label>
        </div>
      </div>
      <p id={`${id}-description`} className="text-xs text-tertiary mb-4">
        Industry and compliance presets are on the roadmap. They do not change
        the generated infrastructure yet.
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-heading`}
        aria-describedby={`${id}-description`}
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
      >
        {OPTIONS.map(({ id: optionId, label, Icon }) => (
          <button
            key={optionId}
            type="button"
            disabled
            className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border-2 transition-all border-border text-tertiary cursor-not-allowed opacity-50"
          >
            <Icon className="w-7 h-7" aria-hidden="true" />
            <span className="text-sm font-bold">{label}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-warning">
              Roadmap
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OtherSpecificationsSection;
