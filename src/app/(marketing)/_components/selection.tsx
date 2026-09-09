import { Image as ImageIcon } from "lucide-react";

/**
 * Vitrine illustrative — format en attente des vrais biens/expériences que
 * l'exploitant ajoutera. Pas de prix affiché : chaque demande donne lieu à
 * une proposition sur-mesure, pas un tarif catalogue (voir DECISIONS.md).
 */
const ITEMS = [
  { category: "Séjours exclusifs", title: "Villa privée en bord de mer" },
  { category: "Gastronomie", title: "Table du chef, service privé" },
  { category: "Navigation", title: "Yacht avec équipage" },
  { category: "Événements sportifs", title: "Loge privée, grand prix" },
  { category: "Séjours exclusifs", title: "Appartement historique, centre-ville" },
  { category: "Œnologie", title: "Dégustation privée, grand cru" },
];

export function Selection() {
  return (
    <section id="selection" className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-medium text-fg">
            Un aperçu de ce que nous pouvons vous obtenir
          </h2>
          <p className="mt-3 text-fg-muted">
            Biens, expériences ou services d&apos;exception — décrivez votre besoin, nous nous
            chargeons du reste.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item, index) => (
            <div key={item.title}>
              <div
                className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-gradient-to-br from-bg-subtle to-border/50"
                style={index % 3 === 1 ? { backgroundImage: "linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 18%, transparent), var(--color-bg))" } : undefined}
              >
                <ImageIcon className="absolute bottom-3.5 right-3.5 h-5 w-5 text-fg-faint" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-accent-hover">
                {item.category}
              </p>
              <p className="mt-1.5 text-sm text-fg">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
