import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { getLegalDisplayConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Refunds — ONE MILLION",
  description: "Draft refund information for the ONE MILLION experiment.",
};

export default function RefundsPage() {
  const legal = getLegalDisplayConfig();

  return (
    <LegalPageLayout title="Refunds (Draft)">
      <LegalSection heading="Refunds are not automatic">
        <p>
          Simply changing your mind after contributing does not automatically
          entitle you to a refund. Any final refund policy for this project
          remains a draft placeholder until it has been reviewed and
          approved.
        </p>
      </LegalSection>

      <LegalSection heading="Placeholder refund policy">
        <p className="text-neutral-500">[REFUND POLICY] — not yet configured.</p>
      </LegalSection>

      <LegalSection heading="Processing time">
        <p>
          If a refund is approved, Stripe may take some time to process it
          and for it to appear back on your original payment method.
        </p>
      </LegalSection>

      <LegalSection heading="Effect on the public total">
        <p>
          Partial and full refunds are reflected in the campaign&apos;s
          publicly displayed total. The application tracks the cumulative
          amount refunded against each contribution, and a fully refunded
          contribution no longer counts toward the total.
        </p>
      </LegalSection>

      <LegalSection heading="Statutory rights">
        <p>
          Nothing on this page overrides any statutory consumer rights you
          may have under the law that applies to you, where applicable.
        </p>
      </LegalSection>

      <LegalSection heading="Requesting a refund">
        <p>Contact {legal.contactEmail} to ask about a refund.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
