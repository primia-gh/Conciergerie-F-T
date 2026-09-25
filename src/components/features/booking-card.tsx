"use client";

import { useTransition } from "react";
import { CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { confirmBooking, completeBooking } from "@/server/bookings/actions";
import { euros } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type BookingInfo = {
  id: string;
  status: string;
  optionName: string;
  optionPrice: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

export function BookingCard({
  booking,
  requestId,
  canManage,
  className = "mt-6",
}: {
  booking: BookingInfo;
  requestId: string;
  canManage: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function handle(action: (bookingId: string, requestId: string) => Promise<{ error: string | null }>) {
    startTransition(async () => {
      const result = await action(booking.id, requestId);
      if (result.error) {
        toast({ title: "Action impossible", description: result.error, variant: "danger" });
      }
    });
  }

  return (
    <section
      aria-labelledby={`reservation-${booking.id}`}
      className={cn("rounded-lg border border-accent/60 bg-surface p-5 sm:p-6", className)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15">
            <CalendarCheck aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={1.5} />
          </span>
          <div>
            <h2 id={`reservation-${booking.id}`} className="text-xs font-medium tracking-[0.2em] text-fg-muted uppercase">
              Réservation
            </h2>
            <p className="mt-1 font-display text-2xl text-fg">{booking.optionName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-fg">{euros(booking.optionPrice)}</span>
              <Badge variant={booking.status === "cancelled" ? "danger" : booking.status === "pending" ? "accent" : "success"}>
                {STATUS_LABEL[booking.status] ?? booking.status}
              </Badge>
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {booking.status === "pending" && (
              <Button disabled={pending} onClick={() => handle(confirmBooking)}>
                Confirmer la réservation
              </Button>
            )}
            {booking.status === "confirmed" && (
              <Button disabled={pending} onClick={() => handle(completeBooking)}>
                Marquer comme terminée
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
