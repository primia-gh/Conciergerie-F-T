const LEGAL_PENDING = ["Confidentialité", "CGU"];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="font-display text-sm text-fg">Conciergerie Premium</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href="#comment-ca-marche" className="text-sm text-fg-muted hover:text-fg">
            Comment ça marche
          </a>
          <a href="#services" className="text-sm text-fg-muted hover:text-fg">
            Services
          </a>
          <a href="#tarifs" className="text-sm text-fg-muted hover:text-fg">
            Tarifs
          </a>
          <a href="#faq" className="text-sm text-fg-muted hover:text-fg">
            FAQ
          </a>
          {LEGAL_PENDING.map((label) => (
            <span key={label} className="text-sm text-fg-muted/50" title="Page à venir (Phase M15)">
              {label}
            </span>
          ))}
        </nav>
        <p className="text-xs text-fg-muted">© {new Date().getFullYear()} Conciergerie Premium</p>
      </div>
    </footer>
  );
}
