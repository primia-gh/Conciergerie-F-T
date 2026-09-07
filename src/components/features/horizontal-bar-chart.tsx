/**
 * Barre horizontale simple, teinte unique (magnitude, pas identité) — voir
 * skill dataviz : un graphe à une seule série n'a pas besoin de légende, et
 * la comparaison de grandeurs entre catégories appelle une seule teinte,
 * jamais une couleur par barre ("rainbow chart").
 */
export function HorizontalBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-fg-muted">{d.label}</span>
          <div className="flex-1">
            <div
              className="h-4 rounded-r-md bg-accent"
              style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-medium text-fg">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
