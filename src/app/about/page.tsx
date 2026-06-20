import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { getLegalDisplayConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "About — ONE MILLION",
  description: "What ONE MILLION is, and what it is not.",
};

export default function AboutPage() {
  const legal = getLegalDisplayConfig();

  return (
    <LegalPageLayout title="About ONE MILLION">
      <LegalSection heading="The idea">
        <p>
          ONE MILLION is a social experiment with one objective: see whether
          people on the internet will voluntarily move a shared number to
          $1,000,000 — simply because the goal exists. There is no cause, no
          charitable registration, and no complicated explanation.
        </p>
      </LegalSection>

      <LegalSection heading="How contributing works">
        <p>
          Contributors choose an amount and contribute voluntarily toward the
          campaign target displayed on the homepage. Payments are processed
          using Stripe-hosted Checkout — card details are entered directly on
          Stripe&apos;s own payment page, and this application never receives
          or stores card numbers.
        </p>
        <p>
          The publicly displayed total only increases after a payment has
          been verified as confirmed by a signed webhook from the payment
          provider — never from anything the browser alone reports. The
          figure you see is the campaign&apos;s confirmed total, net of any
          refunds, and may briefly not reflect contributions that are still
          pending or have failed to complete.
        </p>
        <p>
          This deployment can run in a sandbox/test mode. When test mode is
          active, no real money moves and no card is genuinely charged,
          regardless of what is shown on screen.
        </p>
      </LegalSection>

      <LegalSection heading="What this is not">
        <ul className="list-disc pl-5">
          <li>ONE MILLION is not a registered charity.</li>
          <li>Contributions are not charitable donations.</li>
          <li>
            This is not an investment. Contributors receive no ownership,
            equity, reward, or financial return of any kind.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Who receives the funds">
        <p className={legal.legalEntityNameConfigured ? undefined : "text-neutral-500"}>
          Funds are paid to {legal.legalEntityName}.
        </p>
      </LegalSection>

      <LegalSection heading="Intended use of funds">
        <p className="text-neutral-500">
          [INTENDED USE OF FUNDS] — not yet configured. This will be stated
          truthfully here once decided, and will never be invented in
          advance of an actual decision.
        </p>
      </LegalSection>

      <LegalSection heading="Questions">
        <p>
          {legal.legalEntityNameConfigured ? `${legal.legalEntityName} — ` : ""}
          {legal.contactEmail}
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
