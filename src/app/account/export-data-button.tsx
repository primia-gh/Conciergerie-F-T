"use client";

import { useActionState, useEffect } from "react";
import { exportMyData, type ExportDataState } from "@/server/account/actions";
import { Button } from "@/components/ui/button";

const initialState: ExportDataState = { error: null, data: null };

export function ExportDataButton() {
  const [state, formAction, pending] = useActionState(async () => exportMyData(), initialState);

  useEffect(() => {
    if (!state.data) return;
    const blob = new Blob([state.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state.data]);

  return (
    <form action={formAction}>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Préparation…" : "Exporter mes données (JSON)"}
      </Button>
      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
    </form>
  );
}
