import Link from "next/link";
import { MailCheck } from "lucide-react";
import { TitreAuth } from "../../_components/elements";

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col gap-8">
      <MailCheck aria-hidden="true" strokeWidth={1.25} className="h-12 w-12 text-accent" />
      <TitreAuth
        surtitre="Presque terminé"
        titre="Vérifiez vos e-mails"
        texte="Un lien de confirmation vient de vous être envoyé. Cliquez dessus pour activer votre compte : vous arriverez directement dans votre espace."
      />
      <p className="text-sm leading-relaxed text-fg-muted">
        Rien reçu après quelques minutes ? Regardez vos courriers indésirables, puis{" "}
        <Link href="/signup" className="text-fg underline underline-offset-2 hover:text-accent-hover">
          réessayez
        </Link>
        .
      </p>
    </div>
  );
}
