"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Les liens envoyés depuis le tableau de bord Supabase (« Send magic link »,
 * « Send password recovery ») arrivent sur l'adresse du site avec la session
 * dans la partie `#…` de l'URL, que le serveur ne voit jamais. Ce composant la
 * lit, ouvre la session, efface les jetons de la barre d'adresse et mène à la
 * bonne page. Sans jeton dans l'adresse, il ne fait rien.
 */
export function RecuperationSession() {
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.get("error")) {
      window.location.replace("/login?lien=expire");
      return;
    }
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    const type = fragment.get("type");
    history.replaceState(null, "", window.location.pathname + window.location.search);
    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) window.location.replace("/login?lien=expire");
        else window.location.replace(type === "recovery" ? "/nouveau-mot-de-passe" : "/");
      });
  }, []);

  return null;
}
