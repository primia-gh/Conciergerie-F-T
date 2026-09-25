"use client";

import { useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, LogOut, Menu, UserRound, X } from "lucide-react";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { NotificationsBell, type NotificationRow } from "@/components/features/notifications-bell";
import { signOut } from "@/server/auth/actions";
import { cn } from "@/lib/utils";
import { ESPACES, lienActif, type RoleEspace } from "./navigation";

const ROLE_LIBELLES: Record<RoleEspace, string> = {
  client: "Client",
  concierge: "Concierge",
  admin: "Gérant",
  partner: "Partenaire",
};

type Props = {
  role: RoleEspace;
  prenom: string | null;
  nomComplet: string;
  notifications: NotificationRow[];
};

/**
 * Barre du haut de tous les espaces connectés : marque, menu du rôle,
 * notifications et menu du compte. Sous le seuil du grand écran, le menu passe
 * dans un panneau ouvert par le bouton « Menu ».
 */
export function BarreEspace({ role, prenom, nomComplet, notifications }: Props) {
  const espace = ESPACES[role];
  const chemin = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const idPanneau = useId();
  const initiale = (prenom?.trim()[0] ?? nomComplet.trim()[0] ?? "?").toUpperCase();
  // Le Gérant a six rubriques : le menu complet n'apparaît qu'en très grand écran.
  const seuil = espace.liens.length > 3 ? "xl" : "lg";

  // Échap referme le panneau mobile.
  useEffect(() => {
    if (!menuOuvert) return;
    const fermer = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOuvert(false);
    };
    window.addEventListener("keydown", fermer);
    return () => window.removeEventListener("keydown", fermer);
  }, [menuOuvert]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href={espace.accueil}
          className="flex shrink-0 items-baseline gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          {role === "admin" ? (
            <span className="font-display text-xl whitespace-nowrap sm:text-2xl">
              Espace du <em className="text-accent-hover">Gérant</em>
            </span>
          ) : (
            <>
              <span className="font-display text-xl whitespace-nowrap sm:text-2xl">
                Conciergerie <em className="text-accent-hover">Premium</em>
              </span>
              <span className="hidden border-l border-border pl-3 text-[0.7rem] font-medium tracking-[0.18em] whitespace-nowrap text-fg-muted uppercase md:inline">
                {espace.nom}
              </span>
            </>
          )}
        </Link>

        <nav
          aria-label={espace.nom}
          className={cn("ml-6 hidden items-center gap-1", seuil === "xl" ? "xl:flex" : "lg:flex")}
        >
          {espace.liens.map((lien) => {
            const actif = lienActif(lien, chemin);
            return (
              <Link
                key={lien.href}
                href={lien.href}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center px-3 text-sm whitespace-nowrap transition-colors",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent after:transition-opacity",
                  actif ? "text-fg after:opacity-100" : "text-fg-muted after:opacity-0 hover:text-fg",
                )}
              >
                {lien.libelle}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {espace.notifications && <NotificationsBell notifications={notifications} role={role} />}

          <div className={cn("hidden", seuil === "xl" ? "xl:block" : "lg:block")}>
            <MenuCompte
              initiale={initiale}
              prenom={prenom}
              nomComplet={nomComplet}
              role={role}
              chemin={chemin}
            />
          </div>

          <button
            type="button"
            aria-expanded={menuOuvert}
            aria-controls={idPanneau}
            onClick={() => setMenuOuvert((o) => !o)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-full px-3 text-sm text-fg transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              seuil === "xl" ? "xl:hidden" : "lg:hidden",
            )}
          >
            {menuOuvert ? (
              <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            )}
            <span className="sr-only sm:not-sr-only">Menu</span>
          </button>
        </div>
      </div>

      {menuOuvert && (
        <div
          id={idPanneau}
          className={cn(
            "max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-bg-subtle",
            seuil === "xl" ? "xl:hidden" : "lg:hidden",
          )}
        >
          <nav aria-label={`${espace.nom} (menu)`} className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
            {espace.liens.map((lien) => {
              const actif = lienActif(lien, chemin);
              return (
                <Link
                  key={lien.href}
                  href={lien.href}
                  aria-current={actif ? "page" : undefined}
                  onClick={() => setMenuOuvert(false)}
                  className={cn(
                    "flex min-h-12 items-center border-l-2 pl-4 text-base transition-colors",
                    actif ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg",
                  )}
                >
                  {lien.libelle}
                </Link>
              );
            })}
          </nav>
          <div className="mx-auto flex max-w-6xl flex-col gap-1 border-t border-border px-4 py-3 sm:px-6">
            <p className="flex items-center gap-3 py-2 text-sm text-fg-muted">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 font-display text-accent"
              >
                {initiale}
              </span>
              <span>
                {nomComplet} · {ROLE_LIBELLES[role]}
              </span>
            </p>
            <Link
              href="/account"
              aria-current={chemin === "/account" ? "page" : undefined}
              onClick={() => setMenuOuvert(false)}
              className="flex min-h-12 items-center gap-3 pl-4 text-base text-fg-muted hover:text-fg"
            >
              <UserRound aria-hidden="true" className="h-4 w-4" /> Mon compte
            </Link>
            <Link
              href={espace.voirLeSite}
              onClick={() => setMenuOuvert(false)}
              className="flex min-h-12 items-center gap-3 pl-4 text-base text-fg-muted hover:text-fg"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" /> Voir le site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex min-h-12 w-full items-center gap-3 pl-4 text-left text-base text-fg-muted hover:text-fg"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" /> Se déconnecter
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuCompte({
  initiale,
  prenom,
  nomComplet,
  role,
  chemin,
}: {
  initiale: string;
  prenom: string | null;
  nomComplet: string;
  role: RoleEspace;
  chemin: string;
}) {
  const [deconnexion, startTransition] = useTransition();
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-full pr-3 pl-1.5 text-sm text-fg transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent data-[state=open]:bg-surface"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 font-display text-base text-accent"
          >
            {initiale}
          </span>
          <span className="max-w-32 truncate">{prenom || nomComplet}</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-fg-muted" />
          <span className="sr-only">: menu du compte</span>
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-60 p-1">
        <div className="px-3 py-2.5">
          <p className="truncate text-sm font-medium text-fg">{nomComplet}</p>
          <p className="text-xs text-fg-muted">{ROLE_LIBELLES[role]}</p>
        </div>
        <DropdownSeparator />
        <DropdownItem asChild className="min-h-10 gap-3 px-3">
          <Link href="/account" aria-current={chemin === "/account" ? "page" : undefined}>
            <UserRound aria-hidden="true" className="h-4 w-4 text-fg-muted" /> Mon compte
          </Link>
        </DropdownItem>
        <DropdownItem asChild className="min-h-10 gap-3 px-3">
          <Link href={ESPACES[role].voirLeSite}>
            <ExternalLink aria-hidden="true" className="h-4 w-4 text-fg-muted" /> Voir le site
          </Link>
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          className="min-h-10 gap-3 px-3"
          disabled={deconnexion}
          onSelect={() => startTransition(() => signOut())}
        >
          <LogOut aria-hidden="true" className="h-4 w-4 text-fg-muted" />
          {deconnexion ? "Déconnexion…" : "Se déconnecter"}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
