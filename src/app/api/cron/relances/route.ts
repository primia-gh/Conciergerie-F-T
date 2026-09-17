import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { ecrireAuJournal } from "@/lib/agent/journal";

export const dynamic = "force-dynamic";

const DELAI_RELANCE_MS = 48 * 60 * 60 * 1000;

/**
 * Relance automatique des prospects propriétaires (lot L1) : une seule fois,
 * 48h après le dernier message sortant sans réponse, uniquement s'ils ont
 * laissé un e-mail. Déclenché par Vercel Cron (voir vercel.json) — la
 * fréquence horaire de la tâche donne une précision suffisante sur la
 * fenêtre de 48h sans sur-solliciter la base pour un volume de prospects
 * qui reste faible en phase 1.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  const { data: regleRelance } = await supabase
    .from("regle")
    .select("niveau_autonomie")
    .eq("domaine", "communication")
    .eq("tache", "relance_prospect_48h")
    .eq("actif", true)
    .maybeSingle();
  if (regleRelance?.niveau_autonomie && regleRelance.niveau_autonomie !== "agit_seul") {
    return NextResponse.json({ ok: true, relancesEnvoyees: 0, note: "Relance désactivée : niveau d'autonomie réglé en dessous de agit_seul." });
  }

  const { data: prospects, error } = await supabase
    .from("bien_prospect")
    .select("id, proprietaire_id, proprietaire:proprietaire_id(id, nom, email, statut)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let relancesEnvoyees = 0;

  for (const prospect of prospects ?? []) {
    const proprietaire = Array.isArray(prospect.proprietaire)
      ? prospect.proprietaire[0]
      : prospect.proprietaire;
    if (!proprietaire || proprietaire.statut !== "prospect" || !proprietaire.email) continue;

    const { data: dernierMessage } = await supabase
      .from("message_agent")
      .select("sens, created_at")
      .eq("bien_prospect_id", prospect.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!dernierMessage || dernierMessage.sens !== "sortant") continue;
    const age = Date.now() - new Date(dernierMessage.created_at as string).getTime();
    if (age < DELAI_RELANCE_MS) continue;

    const { data: relanceExistante } = await supabase
      .from("action")
      .select("id")
      .eq("type", "relance_prospect")
      .eq("entite_id", prospect.id)
      .maybeSingle();
    if (relanceExistante) continue;

    const texte =
      "Vous vous étiez renseigné sur la gestion de votre bien avec Conciergerie F&T — souhaitez-vous qu'on reprenne l'échange où on l'avait laissé ?";

    await supabase.from("message_agent").insert({
      bien_prospect_id: prospect.id,
      canal: "email",
      sens: "sortant",
      contenu: texte,
      auteur: "agent",
      statut: "envoye",
    });

    if (resend) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM_ADDRESS ?? "onboarding@resend.dev",
        to: proprietaire.email,
        subject: "Conciergerie F&T — toujours partant(e) ?",
        text: texte,
      });
    }

    await ecrireAuJournal({
      type: "relance_prospect",
      entiteType: "bien_prospect",
      entiteId: prospect.id,
      decision: "Relance à 48h sans réponse, envoyée une seule fois",
      regleAppliquee: "relance_prospect_48h",
      autonomieAuMoment: "agit_seul",
      auteur: "agent",
      resultat: resend ? "envoye" : "email_non_configure",
    });
    relancesEnvoyees++;
  }

  return NextResponse.json({ ok: true, relancesEnvoyees });
}
