import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">
        Conciergerie privée
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-fg sm:text-5xl">
        Ce que vous imaginez,
        <br className="hidden sm:block" /> nous l&apos;organisons.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-fg-muted">
        Décrivez votre besoin, un concierge dédié s&apos;en occupe. Restaurants, voyages,
        événements ou démarches du quotidien : vous recevez des solutions prêtes à valider,
        jamais une liste de liens à trier vous-même.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/signup">Faire une demande</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <a href="#comment-ca-marche">Voir comment ça marche</a>
        </Button>
      </div>
    </section>
  );
}
