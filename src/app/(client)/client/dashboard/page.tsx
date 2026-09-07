import { getCurrentProfile } from "@/server/auth/session";
import { SignOutButton } from "@/components/features/sign-out-button";

export default async function ClientDashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bonjour {profile?.first_name ?? ""}
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Comment puis-je vous aider ?</p>
        </div>
        <SignOutButton />
      </div>

      <button
        type="button"
        disabled
        title="Disponible en Phase M5 (voir ROADMAP.md)"
        className="mt-8 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
      >
        Faire une demande — NOT IMPLEMENTED
      </button>

      <div className="mt-10 grid grid-cols-2 gap-4 text-sm text-zinc-500">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          Demandes en cours — NOT IMPLEMENTED
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          Messages — NOT IMPLEMENTED
        </div>
      </div>
    </div>
  );
}
