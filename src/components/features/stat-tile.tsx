import { Card, CardContent } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-fg-muted">{label}</p>
        <p className="mt-1 text-3xl font-semibold text-fg">{value}</p>
        {note && <p className="mt-1 text-xs text-fg-muted">{note}</p>}
      </CardContent>
    </Card>
  );
}
