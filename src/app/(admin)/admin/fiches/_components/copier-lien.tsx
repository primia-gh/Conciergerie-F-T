"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopierLien({ chemin, label }: { chemin: string; label: string }) {
  const [copie, setCopie] = useState(false);
  const [aCopierMain, setACopierMain] = useState<string | null>(null);

  async function copier() {
    const url = `${window.location.origin}${chemin}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers refusé par le navigateur : on affiche le lien à copier à la main.
      setACopierMain(url);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={copier} className="self-start">
        {copie ? <Check aria-hidden="true" className="h-4 w-4" /> : <Link2 aria-hidden="true" className="h-4 w-4" />}
        <span aria-live="polite">{copie ? "Lien copié" : label}</span>
      </Button>
      {aCopierMain && <p className="text-xs break-all text-fg-muted">Copiez ce lien : {aCopierMain}</p>}
    </div>
  );
}
