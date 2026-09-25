import { PhotoCadree, Surtitre } from "@/components/premium/ornements";
import { PHOTOS } from "@/components/premium/photos";

/**
 * Vitrine illustrative : des univers, pas un catalogue. Les photos sont des
 * photos d'ambiance libres de droits (voir photos.ts), jamais un bien ou un
 * partenaire réel. Pas de prix affiché : chaque demande donne lieu à une
 * proposition sur-mesure (voir DECISIONS.md). Section sur fond ivoire.
 */
const ITEMS = [
  { category: "Séjours exclusifs", title: "Villa privée en bord de mer", photo: PHOTOS.villa },
  { category: "Gastronomie", title: "Table du chef, service privé", photo: PHOTOS.chef },
  { category: "Navigation", title: "Yacht avec équipage", photo: PHOTOS.yacht },
  { category: "Événements sportifs", title: "Loge privée, grand prix", photo: PHOTOS.circuit },
  { category: "Séjours exclusifs", title: "Appartement historique, centre-ville", photo: PHOTOS.appartement },
  { category: "Œnologie", title: "Dégustation privée, grand cru", photo: PHOTOS.cave },
];

export function Selection() {
  return (
    <section id="selection" className="theme-premium-clair scroll-mt-20 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6">
        <div className="apparition flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-5">
            <Surtitre>Sélection</Surtitre>
            <h2 className="font-display text-4xl leading-tight text-balance sm:text-5xl">
              Un aperçu de ce que nous pouvons <em className="text-accent">vous obtenir.</em>
            </h2>
          </div>
          <p className="max-w-sm leading-relaxed text-fg-muted">
            Biens, expériences ou services d&apos;exception — décrivez votre besoin, nous nous
            chargeons du reste.
          </p>
        </div>
        <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <li key={item.title} className="apparition flex flex-col gap-4">
              <PhotoCadree
                photo={item.photo}
                sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                className="aspect-[4/3] w-full"
              />
              <p className="text-xs font-medium tracking-[0.24em] text-accent uppercase">{item.category}</p>
              <h3 className="font-display text-2xl">{item.title}</h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
