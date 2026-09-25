"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { markAllNotificationsRead, markNotificationRead } from "@/server/notifications/actions";
import type { NotificationType } from "@/server/notifications/dispatcher";
import { lienNotification, type RoleEspace } from "@/components/espace/navigation";

export type NotificationRow = {
  id: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
  payload?: unknown;
};

const LABELS: Record<NotificationType, string> = {
  REQUEST_CREATED: "Votre demande a bien été reçue",
  REQUEST_ASSIGNED: "Un concierge s'occupe de votre demande",
  MESSAGE_RECEIVED: "Nouveau message",
  PROPOSAL_CREATED: "Vous avez reçu une proposition",
  PROPOSAL_ACCEPTED: "Proposition acceptée par le client",
  PROPOSAL_REJECTED: "Proposition refusée par le client",
  PAYMENT_SUCCESS: "Paiement confirmé",
  BOOKING_CONFIRMED: "Réservation confirmée",
  BOOKING_CANCELLED: "Réservation annulée",
  REQUEST_COMPLETED: "Demande terminée",
};

/**
 * Marquer comme lu n'est pas essentiel : en cas d'échec (réseau, session
 * expirée), la notification redevient simplement non lue au prochain
 * chargement, sans afficher de page d'erreur.
 */
async function enArrierePlan(action: Promise<void>): Promise<void> {
  try {
    await action;
  } catch {
    // Volontairement ignoré, voir plus haut.
  }
}

function depuis(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Cloche de l'espace connecté. Une notification lue l'est tout de suite à
 * l'écran (sans attendre le serveur) ; celles qui concernent une demande
 * ouvrent son suivi.
 */
export function NotificationsBell({ notifications, role }: { notifications: NotificationRow[]; role: RoleEspace }) {
  const chemin = usePathname();
  const [, startTransition] = useTransition();
  const [luesIci, setLuesIci] = useState<Set<string> | "toutes">(new Set());
  const estLue = (n: NotificationRow) => !!n.read_at || luesIci === "toutes" || luesIci.has(n.id);
  const nonLues = notifications.filter((n) => !estLue(n)).length;

  function marquer(n: NotificationRow) {
    if (estLue(n)) return;
    setLuesIci((actuel) => (actuel === "toutes" ? actuel : new Set(actuel).add(n.id)));
    startTransition(() => enArrierePlan(markNotificationRead(n.id, chemin)));
  }

  function toutMarquer() {
    setLuesIci("toutes");
    startTransition(() => enArrierePlan(markAllNotificationsRead(chemin)));
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={nonLues > 0 ? `Notifications, ${nonLues} non lue${nonLues > 1 ? "s" : ""}` : "Notifications"}
        >
          <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          {nonLues > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg"
            >
              {nonLues > 9 ? "9+" : nonLues}
            </span>
          )}
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-semibold text-fg">Notifications</p>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <BellOff aria-hidden="true" className="h-6 w-6 text-fg-faint" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">Aucune notification pour le moment.</p>
          </div>
        ) : (
          <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-1">
            {notifications.map((n) => {
              const lue = estLue(n);
              const href = lienNotification(role, n.payload);
              const contenu = (
                <>
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${lue ? "bg-transparent" : "bg-accent"}`}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className={lue ? "text-fg-muted" : "font-medium text-fg"}>
                      {LABELS[n.type] ?? n.type}
                      {!lue && <span className="sr-only"> (non lue)</span>}
                    </span>
                    <span className="text-xs text-fg-faint">{depuis(n.created_at)}</span>
                  </span>
                </>
              );
              return href ? (
                <DropdownItem key={n.id} asChild className="items-start gap-3 px-3 py-2.5" onSelect={() => marquer(n)}>
                  <Link href={href}>{contenu}</Link>
                </DropdownItem>
              ) : (
                <DropdownItem key={n.id} className="items-start gap-3 px-3 py-2.5" onSelect={() => marquer(n)}>
                  {contenu}
                </DropdownItem>
              );
            })}
          </div>
        )}
        {nonLues > 0 && (
          // Élément du menu (et non simple bouton) pour rester accessible au clavier ;
          // le menu reste ouvert pour voir le résultat.
          <DropdownItem
            className="justify-center rounded-none border-t border-border py-3 text-xs font-medium text-accent"
            onSelect={(e) => {
              e.preventDefault();
              toutMarquer();
            }}
          >
            Tout marquer comme lu
          </DropdownItem>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
