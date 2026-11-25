import { getHelmChartConfig } from "../../config/helmChartsConfig";
import { Callout } from "@/components/shared/callout";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// YAML values editor of one Helm chart (wizard). `chartName` is the chart key.
const HelmValuesModal = ({ chartName, values, onChange, onClose, onSave }) => {
  const name = getHelmChartConfig(chartName)?.displayName ?? chartName;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Edit {name} values</DialogTitle>
          <DialogDescription>Helm values in YAML.</DialogDescription>
        </DialogHeader>

        {/* The wizard keeps no chart values (environments store none) and
            generation reads only `services.eks.helmCharts.<chart>.enabled`
            (OP-200). Saying so beats letting the user believe their YAML is
            kept or reaches the generated output. */}
        <Callout variant="warning" title="Preview only.">
          Custom values are not saved yet: charts are generated with their
          defaults. To customize a chart today, edit its values file in the
          generated repository after the push.
        </Callout>

        <div className="relative">
          <Textarea
            autoFocus
            value={values ?? ""}
            onChange={(e) => onChange(e.target.value)}
            spellCheck="false"
            aria-label={`YAML values for ${name}`}
            className="field-sizing-fixed h-64 resize-none pr-20 font-mono text-xs leading-relaxed md:text-xs"
          />
          <CopyButton
            text={values ?? ""}
            label="Copy values"
            visibleLabel="Copy"
            size="sm"
            className="absolute top-1.5 right-1.5"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HelmValuesModal;
