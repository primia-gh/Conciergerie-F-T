import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Photo } from "./photos";

// Éléments décoratifs de la palette « Marine & or » (canevas « Conciergerie
// F&T — Accueil », planche « Premium — système visuel »).

/** Rayons du soleil Art déco : 37 traits partant du bas, calculés une fois. */
const RAYONS = Array.from({ length: 37 }, (_, i) => {
  const angle = Math.PI + (Math.PI * i) / 36;
  return `M450 450L${(450 + Math.cos(angle) * 450).toFixed(1)} ${(450 + Math.sin(angle) * 450).toFixed(1)}`;
}).join("");

/** Soleil Art déco en filets dorés, purement décoratif. */
export function Soleil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 450"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none text-accent", className)}
    >
      <path d={RAYONS} stroke="currentColor" strokeWidth="1" />
      {[150, 270, 390].map((r) => (
        <circle key={r} cx="450" cy="450" r={r} stroke="currentColor" strokeWidth="1" />
      ))}
    </svg>
  );
}

/** Petit titre en capitales précédé d'un filet doré. */
export function Surtitre({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3.5 text-xs font-medium tracking-[0.28em] text-accent uppercase", className)}>
      <span aria-hidden="true" className="h-px w-10 bg-current" />
      {children}
    </p>
  );
}

/**
 * Photo au même étalonnage que les autres (voile marine en bas, léger reflet
 * chaud), avec en option le cadre doré décalé de la maquette et un zoom lent
 * au survol (coupé si le visiteur a demandé moins d'animations).
 */
export function PhotoCadree({
  photo,
  sizes,
  cadre = false,
  priority = false,
  className,
}: {
  photo: Photo;
  sizes: string;
  cadre?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {cadre && (
        <span aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 border border-accent/60 sm:translate-x-4 sm:translate-y-4" />
      )}
      <div className="group relative h-full w-full overflow-hidden bg-surface">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-[#0e1a31]/15 mix-blend-multiply" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a1427]/70 to-transparent" />
      </div>
    </div>
  );
}
