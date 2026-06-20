import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Refund Policy — ONE MILLION",
  description: "How refunds work for contributions made to ONE MILLION.",
};

export default function RefundsPage() {
  return (
    <LegalPageLayout title="Refund Policy">
      <LegalSection heading="1. General policy">
        <p>Contributions to ONE MILLION are voluntary and are normally final and non-refundable.</p>
        <p>
          A change of mind, dissatisfaction with the project, failure to
          reach the target, closure of the website or disagreement with how
          the funds are used does not normally qualify for a refund.
        </p>
      </LegalSection>

      <LegalSection heading="2. Genuine payment mistakes">
        <p>A full or partial refund may be considered where:</p>
        <ul className="list-disc pl-5">
          <li>The same contribution was accidentally made more than once</li>
          <li>An incorrect amount was entered because of a genuine payment mistake</li>
          <li>The payment was made without the payment-method holder&apos;s authorisation</li>
          <li>The transaction was fraudulent</li>
          <li>A refund is required by applicable law</li>
        </ul>
        <p>Refund requests will be reviewed individually. Evidence reasonably necessary to identify and investigate the payment may be requested.</p>
      </LegalSection>

      <LegalSection heading="3. Requesting a refund">
        <p>Contact:</p>
        <p>millionproject1m@gmail.com</p>
        <p>Provide:</p>
        <ul className="list-disc pl-5">
          <li>The date of the contribution</li>
          <li>The contribution amount</li>
          <li>The name or email associated with the payment</li>
          <li>The Stripe receipt or payment reference, where available</li>
          <li>A brief explanation of the mistake</li>
        </ul>
        <p>Do not send a full card number or card security code by email.</p>
        <p>Refund requests should be made as soon as reasonably possible after discovering the mistake.</p>
      </LegalSection>

      <LegalSection heading="4. Refund decisions">
        <p>Submitting a request does not guarantee that a refund will be approved.</p>
        <p>A request will be assessed reasonably using the payment information available and the circumstances described.</p>
        <p>Nothing in this policy removes any statutory right to a refund that cannot legally be excluded.</p>
      </LegalSection>

      <LegalSection heading="5. Processing approved refunds">
        <p>Approved refunds will be returned through Stripe to the original payment method.</p>
        <p>
          The time taken for the money to appear depends on Stripe, the
          payment network and the contributor&apos;s bank. ONE MILLION
          cannot guarantee the exact date on which an approved refund will
          appear.
        </p>
      </LegalSection>

      <LegalSection heading="6. Effect on the public total">
        <p>A full refund will remove the refunded contribution from the publicly displayed total once the refund has been confirmed.</p>
        <p>A partial refund will reduce the contribution and public total by the amount refunded.</p>
      </LegalSection>

      <LegalSection heading="7. Chargebacks and unauthorised payments">
        <p>
          Anyone who believes their payment method was used without
          permission should contact millionproject1m@gmail.com and their
          bank or payment provider promptly.
        </p>
        <p>Fraudulent or abusive refund and chargeback activity may be investigated and reported to Stripe or relevant authorities.</p>
      </LegalSection>

      <LegalSection heading="8. Contact">
        <p>Refund questions should be sent to:</p>
        <p>millionproject1m@gmail.com</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
