import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="border-t border-border bg-accent py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="font-display text-3xl font-medium text-accent-fg">
          Votre première demande, aujourd&apos;hui
        </h2>
        <p className="max-w-md text-accent-fg/80">
          Créez votre compte en une minute et confiez-nous votre première mission — sans
          engagement.
        </p>
        <Button asChild size="lg" variant="secondary">
          <Link href="/signup">Créer mon compte</Link>
        </Button>
      </div>
    </section>
  );
}
