import { useId } from "react";
import { Badge } from "@/components/ui/badge";

const OPTIONS = [
  "Healthcare",
  "E-commerce",
  "Fintech",
  "Defence",
  "Startup",
  "ISO 27001",
  "DORA",
  "NIS2",
];

// Roadmap only: nothing reads a selection yet, so the presets are plain chips,
// never controls that pretend to work.
const OtherSpecificationsSection = () => {
  const id = useId();

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="flex flex-col gap-2 border-t pt-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={`${id}-heading`} className="text-sm font-medium">
          Industry and compliance presets
        </h2>
        <Badge variant="outline">Roadmap</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        They do not change the generated infrastructure yet.
      </p>
      <ul aria-labelledby={`${id}-heading`} className="flex flex-wrap gap-1.5">
        {OPTIONS.map((label) => (
          <li key={label}>
            <Badge variant="tag">{label}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default OtherSpecificationsSection;
