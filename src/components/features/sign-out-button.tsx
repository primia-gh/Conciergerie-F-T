import { signOut } from "@/server/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        Se déconnecter
      </button>
    </form>
  );
}
