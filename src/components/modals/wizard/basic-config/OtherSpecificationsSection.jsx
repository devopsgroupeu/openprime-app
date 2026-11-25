import { useId } from "react";
import {
  BadgeCheck,
  FileCheck,
  HeartPulse,
  Landmark,
  Network,
  Rocket,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CheckboxCard } from "./RadioCard";

const OPTIONS = [
  { id: "healthcare", label: "Healthcare", Icon: HeartPulse },
  { id: "ecommerce", label: "E-commerce", Icon: ShoppingCart },
  { id: "fintech", label: "Fintech", Icon: Landmark },
  { id: "defence", label: "Defence", Icon: Shield },
  { id: "startup", label: "Startup", Icon: Rocket },
  { id: "iso27001", label: "ISO 27001", Icon: BadgeCheck },
  { id: "dora", label: "DORA", Icon: FileCheck },
  { id: "nis2", label: "NIS2", Icon: Network },
];

// Roadmap only: nothing reads a selection yet, so every preset is a disabled
// tile (announced as unavailable), the same look as the roadmap providers.
const OtherSpecificationsSection = () => {
  const id = useId();

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="flex flex-col gap-2 border-t pt-6"
    >
      <h2 id={`${id}-heading`} className="text-sm font-medium">
        Industry and compliance presets
      </h2>
      <p className="text-xs text-muted-foreground">
        They do not change the generated infrastructure yet.
      </p>
      <ul
        aria-labelledby={`${id}-heading`}
        className="mt-1 grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {OPTIONS.map(({ id: option, label, Icon }) => (
          <li key={option} className="grid">
            <CheckboxCard
              id={`${id}-${option}`}
              title={label}
              disabled
              art={<Icon className="size-6 text-muted-foreground opacity-60" />}
              badge={<Badge variant="tag">Roadmap</Badge>}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default OtherSpecificationsSection;
