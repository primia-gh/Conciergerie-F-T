import {
  UtensilsCrossed,
  Plane,
  BedDouble,
  Car,
  CalendarHeart,
  Sparkles,
  HeartPulse,
  ShoppingBag,
  Star,
} from "lucide-react";
import { Surtitre } from "./ornements";

const SERVICES = [
  { icon: UtensilsCrossed, label: "Restaurant" },
  { icon: Plane, label: "Voyage" },
  { icon: BedDouble, label: "Hôtel" },
  { icon: Car, label: "Transport" },
  { icon: CalendarHeart, label: "Événement" },
  { icon: Sparkles, label: "Expérience" },
  { icon: HeartPulse, label: "Bien-être" },
  { icon: ShoppingBag, label: "Shopping" },
  { icon: Star, label: "Lifestyle" },
];

export function Services() {
  return (
    <section id="services" className="scroll-mt-20 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 lg:flex-row lg:gap-20">
        <div className="apparition flex flex-col gap-5 lg:w-96 lg:shrink-0">
          <Surtitre>Services</Surtitre>
          <h2 className="font-display text-4xl leading-tight text-balance sm:text-5xl">
            Un seul interlocuteur, <em className="text-accent-hover">tous les domaines.</em>
          </h2>
          <p className="text-lg leading-relaxed text-fg-muted">
            Si ça se demande, ça se traite. Voici les catégories les plus courantes.
          </p>
        </div>
        {/* Grille à filets dorés : l'espace d'1 px entre cases laisse voir le fond doré. */}
        <ul className="apparition grid flex-1 grid-cols-2 gap-px self-start border border-filet bg-filet sm:grid-cols-3">
          {SERVICES.map((service) => (
            <li key={service.label} className="flex flex-col gap-6 bg-bg px-6 py-8 sm:px-7">
              <service.icon aria-hidden="true" strokeWidth={1.25} className="h-8 w-8 text-accent" />
              <span className="font-display text-xl sm:text-2xl">{service.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
