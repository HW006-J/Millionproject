import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { getLegalDisplayConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy — ONE MILLION",
  description: "Draft privacy notice for the ONE MILLION experiment.",
};

export default function PrivacyPage() {
  const legal = getLegalDisplayConfig();

  return (
    <LegalPageLayout title="Privacy (Draft)">
      <p className="text-neutral-400">
        This notice describes what the current implementation actually does.
        It is a development-stage draft, not legal advice, and has not been
        reviewed by a lawyer.
      </p>

      <LegalSection heading="Information we may receive">
        <ul className="list-disc pl-5">
          <li>A display name you choose to submit, or your choice to remain anonymous.</li>
          <li>Your chosen contribution amount, and whether you choose to hide it publicly.</li>
          <li>The status of your contribution (pending, confirmed, failed, or refunded).</li>
          <li>
            Ordinary technical information inherent to web requests (such as
            IP address and browser information), which may be processed by
            our hosting and payment infrastructure as part of normal
            operation.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Payment information">
        <p>
          Card details are entered directly on Stripe-hosted Checkout and are
          never received or stored by this application. Stripe may process
          your personal and payment information under its own privacy policy
          and terms.
        </p>
      </LegalSection>

      <LegalSection heading="Admin access">
        <p>
          A single administrator account can sign in using a secure, signed
          session cookie to view operational statistics and moderate public
          display names. CSV export of contribution records is restricted to
          that authenticated administrator only.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies and tracking">
        <p>
          This application does not currently use advertising or analytics
          cookies or trackers of any kind. The only cookie in use is the
          secure admin session cookie described above, which is not set for
          ordinary visitors.
        </p>
      </LegalSection>

      <LegalSection heading="Data storage">
        <p>
          Contribution records are stored in an operational database for the
          purpose of running the campaign (tallying totals, preventing
          duplicate payments, and handling refunds). An administrator can
          hide a display name from public view without deleting the
          underlying record, for moderation and audit purposes.
        </p>
      </LegalSection>

      <LegalSection heading="Retention (placeholder)">
        <p className="text-neutral-500">
          [DATA RETENTION POLICY] — a specific retention period has not yet
          been decided. This will be stated truthfully here once approved.
        </p>
      </LegalSection>

      <LegalSection heading="Your contact and data rights (placeholder)">
        <p className="text-neutral-500">
          [DATA RIGHTS PROCESS] — not yet configured. Depending on your
          jurisdiction you may have rights over your personal data; until a
          formal process is approved, you can reach us at {legal.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection heading="Jurisdiction-specific requirements">
        <p className="text-neutral-500">
          [OPERATING JURISDICTION] — additional disclosures required by
          specific privacy laws (such as GDPR or CCPA) have not yet been
          reviewed by a lawyer and are not included here.
        </p>
      </LegalSection>

      <LegalSection heading="No guarantees">
        <p>
          No method of transmitting or storing data is perfectly secure. We
          do not claim absolute security or guaranteed deletion of any data.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          {legal.legalEntityNameConfigured ? `${legal.legalEntityName} — ` : ""}
          {legal.contactEmail}
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
