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
    <section id="services" className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-medium text-fg">Un seul interlocuteur, tous les domaines</h2>
          <p className="mt-3 text-fg-muted">
            Si ça se demande, ça se traite. Voici les catégories les plus courantes.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICES.map((service) => (
            <div
              key={service.label}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface px-4 py-6 text-center shadow-soft"
            >
              <service.icon className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-fg">{service.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
