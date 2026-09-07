import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Renommé depuis `middleware.ts` : convention Next.js 16 (voir ARCHITECTURE.md §11).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
