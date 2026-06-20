import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refund Policy" },
];

/**
 * A restrained transparency footer — deliberately small and visually quiet
 * so it never competes with the main contribution CTA above it.
 */
export function LegalFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-neutral-500">
      {LEGAL_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-neutral-300 hover:underline">
          {link.label}
        </Link>
      ))}
    </footer>
  );
}
