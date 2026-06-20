import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Authorization is checked here, independently of the Proxy and of any
  // layout — this is the real security boundary for this page.
  const admin = await requireAdmin();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <p className="text-sm text-neutral-400">Signed in as {admin.email}</p>
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Admin authentication is working.
      </h1>
      <p className="max-w-md text-sm text-neutral-400">
        The dashboard, contribution moderation, campaign settings, and CSV
        export aren&apos;t built yet — this page only proves the
        authentication foundation works.
      </p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-full border border-neutral-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
