import type { ReactNode } from "react";
import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
];

interface LegalPageLayoutProps {
  title: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-neutral-400">
        <Link href="/" className="hover:underline">
          ONE MILLION
        </Link>
        <nav aria-label="Legal pages" className="flex flex-wrap gap-4">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div
        role="note"
        className="rounded-2xl border border-dashed border-neutral-600 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300"
      >
        <strong className="text-white">Development-stage draft.</strong> This
        page is a placeholder template for a project still in sandbox/test
        mode. It has not been reviewed by a lawyer, is not legal advice, and
        must not be relied on before professional legal review and before
        accepting real payments.
      </div>

      <article className="flex flex-col gap-6 text-sm leading-7 text-neutral-300">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {children}
      </article>

      <footer className="border-t border-neutral-800 pt-6 text-xs text-neutral-500">
        <Link href="/" className="hover:underline">
          ← Back to ONE MILLION
        </Link>
      </footer>
    </main>
  );
}

interface LegalSectionProps {
  heading: string;
  children: ReactNode;
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-white">{heading}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
