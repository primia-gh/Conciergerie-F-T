# API.md — Surface d'API (Server Actions)

Cette application n'expose pas d'API REST/JSON classique : toute mutation passe par des **Server
Actions** Next.js (`"use server"`), appelées directement depuis les formulaires React (progressive
enhancement via `useActionState`) ou depuis des gestionnaires d'événements côté client. Chaque
action revérifie le rôle appelant (`assertRole`) et s'appuie sur la RLS Postgres comme seconde
ligne de défense — voir SECURITY.md §1.

Convention de retour : la plupart des actions liées à un formulaire renvoient
`{ error: string | null }` (ou un type plus riche mais toujours avec un champ `error`), consommé par
`useActionState` pour afficher un message d'erreur inline sans perdre la saisie utilisateur. Les
actions qui réussissent redirigent (`redirect()`) plutôt que de renvoyer une donnée, sauf mention
contraire.

## Authentification — `src/server/auth/actions.ts`

| Action | Rôle requis | Entrée | Comportement |
|---|---|---|---|
| `signIn(prevState, formData)` | Public | `email`, `password` | Rate-limité (10/min/IP). Redirige vers le dashboard du rôle si succès. |
| `signUp(prevState, formData)` | Public | `email`, `password` (≥8), `firstName`, `lastName` | Rate-limité (5/h/IP). Rôle toujours `client` (jamais transmis par le client). Redirige vers `/signup/check-email`. |
| `signOut()` | Authentifié | — | Redirige vers `/login`. |

## Demandes — `src/server/requests/actions.ts`

| Action | Rôle requis | Entrée | Comportement |
|---|---|---|---|
| `createRequest(formData)` | `client` | Catégorie, titre, description, budget, date/heure, préférences, pièces jointes | Vérifie le quota du plan (`getClientQuota`) avant insertion — renvoie une erreur explicite si dépassé. Insère `requests` + historique + pièces jointes (Storage) + notification `REQUEST_CREATED`. Redirige vers `/client/dashboard`. |
| `assignRequest(requestId)` | `concierge` | — | Verrou optimiste (`status=NEW AND concierge_id IS NULL`) : si deux concierges cliquent simultanément, un seul l'obtient. Notifie le client. |

## Propositions — `src/server/proposals/actions.ts`

| Action | Rôle requis | Comportement |
|---|---|---|
| `startProposal(requestId)` | `concierge` | Crée une proposition `draft`, transitionne la demande vers `PROPOSAL_DRAFT`. |
| `addProposalOption(prevState, formData)` | `concierge` | Ajoute une option (nom, prix, description, partenaire optionnel) à une proposition. |
| `removeProposalOption(optionId, requestId)` | `concierge` | Supprime une option non encore sélectionnée. |
| `sendProposal(proposalId, requestId)` | `concierge` | Passe la proposition à `sent`, la demande à `PROPOSAL_SENT` → `WAITING_CLIENT`, notifie le client. |
| `respondToProposal(prevState, formData)` | `client` | Accepte (crée une `booking`, chaîne `ACCEPTED`→`BOOKING`) ou refuse (repasse en `REJECTED`, message optionnel) une proposition. |

## Réservations — `src/server/bookings/actions.ts`

| Action | Rôle requis | Comportement |
|---|---|---|
| `confirmBooking(bookingId, requestId)` | `concierge`, `admin` | Verrou optimiste sur `status`. Transition `BOOKING`→`CONFIRMED`. Notifie le client. |
| `completeBooking(bookingId, requestId)` | `concierge`, `admin` | Transition `CONFIRMED`→`COMPLETED`. Notifie le client. |

## Messages — `src/server/messages/actions.ts`

| Action | Rôle requis | Comportement |
|---|---|---|
| `sendMessage(prevState, formData)` | `client`, `concierge`, `admin` | Ajoute un message au fil d'une demande. |
| `addInternalNote(prevState, formData)` | `concierge`, `admin` | Note interne (`is_internal_note=true`), invisible du client — appliqué côté RLS, pas seulement UI. |
| `markThreadRead(requestId)` | `client`, `concierge`, `admin` | Marque les messages du fil comme lus. |

## Partenaires — `src/server/partners/actions.ts`

| Action | Rôle requis | Comportement |
|---|---|---|
| `createPartner(prevState, formData)` | `admin` | Crée un partenaire (mini-CRM). |
| `updatePartner(partnerId, prevState, formData)` | `admin` | Met à jour un partenaire existant. |

## Notifications — `src/server/notifications/`

| Fonction | Usage |
|---|---|
| `notify(supabase, {userId, type, payload, emailBody})` | Non exposée en action — appelée en interne par les autres domaines. Écrit toujours une notification `in_app` ; tente un email via Resend uniquement si `RESEND_API_KEY` est configurée (sinon `console.warn`, aucune ligne "email" simulée). |
| `markNotificationRead(notificationId, path)` | `client`, `concierge`, `admin`, `partner` | Marque une notification lue. |

## Compte / RGPD — `src/server/account/actions.ts`

| Action | Rôle requis | Comportement |
|---|---|---|
| `exportMyData()` | Tout rôle authentifié | Renvoie un export JSON complet des données personnelles de l'appelant (profil, demandes, messages, réservations, notifications, pièces jointes, propositions, fiche partenaire). Aucune donnée d'un autre utilisateur. |
| `deleteMyAccount()` | Tout rôle authentifié | Soft-delete + anonymisation des champs personnels sur `profiles`, déclenche le bannissement Auth (trigger), déconnecte, redirige vers `/compte-supprime`. Irréversible. |

## Abonnements — `src/server/subscriptions/quota.ts`

Pas une Server Action (pas de mutation) mais une fonction serveur appelée par plusieurs pages/
actions : `getClientQuota(supabase, clientId)` résout le plan actif du client (FREE par défaut,
aucune ligne factice créée) et calcule l'usage du mois calendaire en cours.

## Routes publiques (non-API)

`/`, `/login`, `/signup`, `/signup/check-email`, `/confidentialite`, `/compte-supprime`,
`/robots.txt`, `/sitemap.xml` — accessibles sans authentification (voir
`src/lib/supabase/middleware.ts`, `PUBLIC_PATHS`). Toute autre route redirige vers `/login` si
non authentifié.
