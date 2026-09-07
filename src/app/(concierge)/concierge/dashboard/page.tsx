import { getCurrentProfile } from "@/server/auth/session";
import { SignOutButton } from "@/components/features/sign-out-button";

export default async function ConciergeDashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">
            NOT IMPLEMENTED
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Espace concierge — {profile?.first_name ?? ""}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Le tableau de bord opérationnel arrive en Phase M6 (voir ROADMAP.md).
          </p>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
