"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopierLienGuide({ logementId }: { logementId: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    const url = `${window.location.origin}/guide/${logementId}`;
    await navigator.clipboard.writeText(url);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={copier}>
      {copie ? "Lien copié !" : "Copier le lien du guide voyageur"}
    </Button>
  );
}
