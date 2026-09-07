import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-warning">
        Modèle — à faire valider par un juriste avant mise en production
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-fg">
        Politique de confidentialité
      </h1>
      <p className="mt-2 text-sm text-fg-muted">Dernière mise à jour : 7 septembre 2026.</p>

      <div className="prose prose-sm mt-8 flex max-w-none flex-col gap-6 text-fg">
        <section>
          <h2 className="font-display text-lg font-medium text-fg">1. Responsable de traitement</h2>
          <p className="mt-2 text-fg-muted">
            [À COMPLÉTER : raison sociale, forme juridique, SIRET, adresse du siège social]
            exploite Conciergerie Premium et est responsable du traitement des données décrites
            ci-dessous. Pour toute question relative à vos données personnelles, contactez
            [À COMPLÉTER : adresse email dédiée, ex. dpo@…].
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fg">2. Données collectées et finalités</h2>
          <ul className="mt-2 list-disc pl-5 text-fg-muted">
            <li>
              <strong>Compte</strong> (email, nom, prénom, téléphone) — création et gestion de
              votre compte, authentification. Base légale : exécution du contrat.
            </li>
            <li>
              <strong>Demandes de conciergerie</strong> (titre, description, budget, dates,
              pièces jointes) — mise en relation avec un concierge et exécution du service
              demandé. Base légale : exécution du contrat.
            </li>
            <li>
              <strong>Messages</strong> échangés avec votre concierge — suivi de votre demande.
              Base légale : exécution du contrat.
            </li>
            <li>
              <strong>Notifications</strong> (in-app et email) — vous informer de l&apos;avancement
              de vos demandes. Base légale : exécution du contrat / intérêt légitime.
            </li>
            <li>
              <strong>Facturation et abonnement</strong> — le cas échéant, gérée par notre
              prestataire de paiement (Stripe) ; nous ne stockons aucune donnée bancaire sur nos
              serveurs. Base légale : exécution du contrat, obligation légale (comptabilité).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fg">3. Destinataires des données</h2>
          <p className="mt-2 text-fg-muted">
            Vos données sont accessibles à notre équipe (concierges, administration) dans la
            stricte limite de leurs missions, ainsi qu&apos;à nos sous-traitants techniques :
            hébergement de la base de données et de l&apos;authentification (Supabase, Union
            européenne), envoi d&apos;emails transactionnels (Resend), traitement des paiements
            (Stripe, lorsque activé). Aucune donnée n&apos;est vendue à des tiers.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fg">4. Durée de conservation</h2>
          <p className="mt-2 text-fg-muted">
            Vos données sont conservées le temps de la relation contractuelle, puis archivées
            pendant la durée requise par nos obligations légales (comptables, notamment). En cas
            de suppression de compte, vos données personnelles directement identifiantes (nom,
            téléphone, email) sont effacées immédiatement ; l&apos;historique des demandes et
            réservations est conservé sous forme dépersonnalisée à des fins probatoires et
            statistiques.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fg">5. Vos droits</h2>
          <p className="mt-2 text-fg-muted">
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
            d&apos;effacement, de limitation, d&apos;opposition et de portabilité de vos données.
          </p>
          <ul className="mt-2 list-disc pl-5 text-fg-muted">
            <li>
              <strong>Accès et rectification</strong> : modifiables directement depuis votre
              espace « Mon compte ».
            </li>
            <li>
              <strong>Portabilité</strong> : bouton « Exporter mes données » dans votre espace{" "}
              <Link href="/account" className="underline">
                Mon compte
              </Link>{" "}
              — génère un export JSON complet de vos données.
            </li>
            <li>
              <strong>Effacement</strong> : bouton « Supprimer mon compte » dans votre espace{" "}
              <Link href="/account" className="underline">
                Mon compte
              </Link>{" "}
              — suppression immédiate et irréversible de l&apos;accès à votre compte et
              anonymisation de vos données personnelles.
            </li>
            <li>
              Pour toute autre demande (limitation, opposition), contactez
              [À COMPLÉTER : email de contact].
            </li>
          </ul>
          <p className="mt-2 text-fg-muted">
            Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL
            (
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              www.cnil.fr
            </a>
            ) si vous estimez que le traitement de vos données n&apos;est pas conforme à la
            réglementation.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fg">6. Sécurité</h2>
          <p className="mt-2 text-fg-muted">
            Vos données sont protégées par un contrôle d&apos;accès strict par rôle (client,
            concierge, administration, partenaire), appliqué à la fois au niveau applicatif et au
            niveau de la base de données (Row Level Security). Voir{" "}
            <span className="font-mono text-xs">SECURITY.md</span> pour le détail technique.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fg">7. Cookies</h2>
          <p className="mt-2 text-fg-muted">
            Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement du
            service (maintien de votre session de connexion). Aucun cookie de mesure d&apos;audience
            ou publicitaire n&apos;est déposé à ce stade.
          </p>
        </section>
      </div>
    </div>
  );
}
