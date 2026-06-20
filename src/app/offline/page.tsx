import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're offline — ONE MILLION",
  description: "An internet connection is required to use ONE MILLION.",
  robots: { index: false, follow: false },
};

/**
 * The service worker's only offline fallback target. Deliberately static
 * and minimal: no campaign totals (anything cached here could go stale and
 * mislead), no payment controls, no admin links. Its only job is to say
 * plainly that connectivity is required and offer a way to retry.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
        ONE MILLION
      </p>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        An internet connection is required to view the current total, contribute, or use admin
        features. Reconnect and try again.
      </p>
      <Link
        href="/"
        className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
      >
        Try again
      </Link>
    </main>
  );
}
