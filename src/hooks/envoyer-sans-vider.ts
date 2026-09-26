import { startTransition, type FormEvent } from "react";

/**
 * Envoie un formulaire à une action serveur (celle de useActionState) sans
 * passer par la propriété `action` du <form> : React viderait alors les champs
 * même quand l'action renvoie une erreur, et la saisie serait perdue (message
 * collé, brouillon corrigé…). Le bouton qui a servi à envoyer reste transmis.
 */
export function envoyerSansVider(formAction: (donnees: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const bouton = (e.nativeEvent as SubmitEvent).submitter;
    const donnees = new FormData(e.currentTarget, bouton);
    startTransition(() => formAction(donnees));
  };
}
