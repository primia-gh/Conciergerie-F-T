"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/server/auth/actions";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Créer un compte
      </h1>
      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="firstName"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Prénom
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="lastName"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Nom
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Création..." : "Créer mon compte"}
        </button>
      </form>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-zinc-900 dark:text-zinc-50">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
