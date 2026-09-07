"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { confirmBooking, completeBooking } from "@/server/bookings/actions";

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
}: {
  booking: BookingInfo;
  requestId: string;
  canManage: boolean;
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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Réservation</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-fg">
            {booking.optionName} — {booking.optionPrice}€
          </p>
          <Badge variant={booking.status === "completed" ? "success" : "accent"} className="mt-1">
            {STATUS_LABEL[booking.status] ?? booking.status}
          </Badge>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {booking.status === "pending" && (
              <Button size="sm" disabled={pending} onClick={() => handle(confirmBooking)}>
                Confirmer la réservation
              </Button>
            )}
            {booking.status === "confirmed" && (
              <Button size="sm" disabled={pending} onClick={() => handle(completeBooking)}>
                Marquer comme terminée
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
