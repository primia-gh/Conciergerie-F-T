import Image from "next/image";
import Link from "next/link";

/**
 * Lien F&T introuvable : guide d'un logement désactivé, portail d'un
 * propriétaire supprimé, ou adresse mal recopiée. Le visiteur est souvent un
 * voyageur ou un propriétaire qui a reçu un lien : on lui dit quoi faire.
 */
export default function FtNotFound() {
  return (
    <main id="contenu" className="grain flex min-h-dvh flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <Image src="/brand/cle-ft-clair.svg" alt="" width={58} height={64} className="h-16 w-auto" unoptimized />
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Conciergerie F&amp;T</p>
        <h1 className="font-display text-4xl font-light sm:text-5xl">Ce lien n&apos;est plus disponible.</h1>
        <p className="max-w-md text-lg leading-relaxed text-fg-muted">
          Si votre conciergerie vous l&apos;a envoyé, demandez-lui un lien à jour : il a peut-être été
          renouvelé depuis.
        </p>
      </div>
      <Link
        href="/location"
        className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 font-bold text-brand-fg transition-colors hover:bg-[#e6dccb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        Découvrir Conciergerie F&amp;T
      </Link>
    </main>
  );
}
