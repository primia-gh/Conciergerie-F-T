"use client";

import { useTransition } from "react";
import { Bell } from "lucide-react";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { markNotificationRead } from "@/server/notifications/actions";
import type { NotificationType } from "@/server/notifications/dispatcher";

export type NotificationRow = {
  id: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
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

export function NotificationsBell({
  notifications,
  currentPath,
}: {
  notifications: NotificationRow[];
  currentPath: string;
}) {
  const [, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5">
              <Badge variant="danger" className="h-4 min-w-4 justify-center px-1 text-[10px]">
                {unreadCount}
              </Badge>
            </span>
          )}
        </button>
      </DropdownTrigger>
      <DropdownContent className="w-80">
        {notifications.length === 0 ? (
          <p className="px-2 py-3 text-sm text-fg-muted">Aucune notification.</p>
        ) : (
          notifications.map((notification) => (
            <DropdownItem
              key={notification.id}
              className="flex flex-col items-start gap-0.5"
              onSelect={() => {
                if (!notification.read_at) {
                  startTransition(() => markNotificationRead(notification.id, currentPath));
                }
              }}
            >
              <span className={notification.read_at ? "text-fg-muted" : "font-medium text-fg"}>
                {LABELS[notification.type] ?? notification.type}
              </span>
              <span className="text-xs text-fg-muted">
                {new Date(notification.created_at).toLocaleString("fr-FR")}
              </span>
            </DropdownItem>
          ))
        )}
      </DropdownContent>
    </Dropdown>
  );
}
