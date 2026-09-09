import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Seul endroit du site à utiliser le vert forêt : une touche de couleur
 * riche avant le footer, jamais un token global (voir DECISIONS.md).
 */
export function CtaBanner() {
  return (
    <section className="border-t border-border bg-[#132920] py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="font-display text-3xl font-medium text-[#eef3ee]">
          Votre première demande, aujourd&apos;hui
        </h2>
        <p className="max-w-md text-[#c3d3c8]">
          Créez votre compte en une minute et confiez-nous votre première mission — sans
          engagement.
        </p>
        <Button asChild size="lg">
          <Link href="/signup">Créer mon compte</Link>
        </Button>
      </div>
    </section>
  );
}
