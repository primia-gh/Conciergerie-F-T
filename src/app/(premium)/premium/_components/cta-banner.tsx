import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Bandeau d'appel avant le pied de page, sur le fond encre de la palette
 * « Noir & or ». Le vert forêt qu'il portait avant est désormais la couleur de
 * marque de F&T (voir DECISIONS.md).
 */
export function CtaBanner({ dashboardHref }: { dashboardHref?: string | null }) {
  return (
    <section className="border-t border-border bg-inverse-bg py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="font-display text-4xl font-medium text-inverse-fg">
          {dashboardHref ? "Votre espace vous attend" : "Votre première demande, aujourd'hui"}
        </h2>
        <p className="max-w-md text-[#d6d3d1]">
          {dashboardHref
            ? "Retrouvez vos demandes en cours et confiez-nous votre prochaine mission."
            : "Créez votre compte en une minute et confiez-nous votre première mission — sans engagement."}
        </p>
        <Button asChild size="lg">
          <Link href={dashboardHref ?? "/signup"}>
            {dashboardHref ? "Accéder à mon espace" : "Créer mon compte"}
          </Link>
        </Button>
      </div>
    </section>
  );
}
