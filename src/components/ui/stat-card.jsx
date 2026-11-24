import { Card, CardContent } from "@/components/ui/card";

/** StatCard - the one KPI tile: icon, big value, muted label, optional hint. */
export function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 pt-6 text-center">
        {Icon && <Icon className="size-5 text-muted-foreground" />}
        <span className="text-2xl font-semibold tracking-[-0.02em] tabular-nums">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  );
}
