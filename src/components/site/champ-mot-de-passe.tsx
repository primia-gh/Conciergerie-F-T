"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Champ mot de passe avec bouton « afficher / masquer » (lisible au clavier et au lecteur d'écran). */
export function ChampMotDePasse({
  id,
  name,
  label,
  autoComplete,
  minLength,
  describedBy,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          className="h-11 pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        >
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/** Message d'erreur annoncé aux lecteurs d'écran dès qu'il apparaît. */
export function MessageFormulaire({ erreur, message }: { erreur?: string | null; message?: string | null }) {
  if (erreur) {
    return (
      <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger">
        {erreur}
      </p>
    );
  }
  if (message) {
    return (
      <p role="status" className="rounded-md border border-success/40 bg-success/10 px-3 py-2.5 text-sm text-fg">
        {message}
      </p>
    );
  }
  return null;
}
