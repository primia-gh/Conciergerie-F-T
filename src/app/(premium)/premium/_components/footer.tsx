const LIENS = [
  { href: "/premium#comment-ca-marche", label: "Comment ça marche" },
  { href: "/premium#services", label: "Services" },
  { href: "/premium#selection", label: "Sélection" },
  { href: "/premium#tarifs", label: "Formules" },
  { href: "/premium#faq", label: "FAQ" },
  { href: "/confidentialite", label: "Confidentialité" },
];
// Pages légales à venir (étape 4) : affichées sans lien tant qu'elles n'existent pas.
const LEGAL_PENDING = ["CGU"];

export function MarketingFooter() {
  return (
    <footer className="border-t border-filet bg-bg-subtle py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center lg:flex-row lg:justify-between lg:text-left">
        <p className="font-display text-xl whitespace-nowrap">
          Conciergerie <em className="text-accent-hover">Premium</em>
        </p>
        <nav aria-label="Pied de page" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LIENS.map((lien) => (
            <a key={lien.href} href={lien.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
              {lien.label}
            </a>
          ))}
          {LEGAL_PENDING.map((label) => (
            <span key={label} className="text-sm text-fg-faint" title="Page à venir">
              {label} (à venir)
            </span>
          ))}
        </nav>
        <p className="text-sm text-fg-muted">© {new Date().getFullYear()} Conciergerie Premium</p>
      </div>
    </footer>
  );
}
