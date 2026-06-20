import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { getLegalDisplayConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Terms — ONE MILLION",
  description: "Draft terms for the ONE MILLION experiment.",
};

export default function TermsPage() {
  const legal = getLegalDisplayConfig();

  return (
    <LegalPageLayout title="Terms (Draft)">
      <p className="text-neutral-400">
        These terms are a development-stage draft, not legal advice, and have
        not been reviewed by a lawyer.
      </p>

      <LegalSection heading="1. Eligibility and your responsibility">
        <p>
          You are responsible for ensuring you are legally permitted to make
          a voluntary online payment in your jurisdiction, and that the
          payment method you use is your own or one you are authorized to
          use.
        </p>
      </LegalSection>

      <LegalSection heading="2. Voluntary contributions">
        <p>
          Every contribution to ONE MILLION is entirely voluntary. There is
          no product, service, or cause being purchased.
        </p>
      </LegalSection>

      <LegalSection heading="3. No ownership, return, equity, or guaranteed benefit">
        <p>
          Contributing does not grant ownership, equity, an investment
          return, a reward, or any guaranteed benefit. The only effect of a
          contribution is moving the publicly displayed total.
        </p>
      </LegalSection>

      <LegalSection heading="4. Payment processing">
        <p>
          Payments are processed by a third-party payment provider
          (currently Stripe). Card details are entered directly on the
          provider&apos;s own hosted payment page; this application does not
          receive or store card numbers.
        </p>
      </LegalSection>

      <LegalSection heading="5. Contribution confirmation">
        <p>
          A contribution only counts toward the public total once the
          payment provider has confirmed it as paid, verified through a
          signed webhook. Pending or failed payments are never counted.
        </p>
      </LegalSection>

      <LegalSection heading="6. Campaign suspension or closure">
        <p>
          The campaign may be paused, suspended, or closed at any time,
          including before the target is reached. Pausing only prevents new
          contributions from being started — it does not cancel a payment
          already in progress with the payment provider.
        </p>
      </LegalSection>

      <LegalSection heading="7. Prohibited or abusive use">
        <p>
          You must not use the contribution flow to commit fraud, money
          laundering, or any unlawful act, or to submit a display name that
          is abusive, harassing, or otherwise inappropriate.
        </p>
      </LegalSection>

      <LegalSection heading="8. Intellectual property">
        <p>
          The ONE MILLION name, design, and code belong to their respective
          owners. Nothing in these terms transfers any intellectual property
          to a contributor.
        </p>
      </LegalSection>

      <LegalSection heading="9. Availability and service changes">
        <p>
          This is an experimental, evolving project. Features, copy, and the
          campaign target may change without notice, and the service may be
          unavailable at times.
        </p>
      </LegalSection>

      <LegalSection heading="10. Limitation of liability (placeholder)">
        <p className="text-neutral-500">
          [LIMITATION OF LIABILITY] — placeholder language only. Requires
          professional legal review before this project accepts real
          payments.
        </p>
      </LegalSection>

      <LegalSection heading="11. Governing law and jurisdiction (placeholder)">
        <p className="text-neutral-500">[OPERATING JURISDICTION] — not yet configured.</p>
      </LegalSection>

      <LegalSection heading="12. Contact">
        <p>
          {legal.legalEntityNameConfigured ? `${legal.legalEntityName} — ` : ""}
          {legal.contactEmail}
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
