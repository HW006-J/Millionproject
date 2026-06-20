import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms — ONE MILLION",
  description: "Terms for using ONE MILLION and making a contribution.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms">
      <LegalSection heading="Introduction">
        <p>
          These terms apply when you access ONE MILLION or make a voluntary
          contribution through the website. By making a contribution, you
          confirm that you have read and accepted these terms.
        </p>
      </LegalSection>

      <LegalSection heading="1. Eligibility and responsibility">
        <p>
          You are responsible for ensuring that you are legally permitted to
          make a voluntary online payment and that you are using a payment
          method belonging to you or one that you are authorised to use.
        </p>
      </LegalSection>

      <LegalSection heading="2. Voluntary contributions">
        <p>
          Every payment to ONE MILLION is an entirely voluntary contribution.
          No product, service, charitable benefit or other item is being
          purchased.
        </p>
        <p>ONE MILLION is not a charity, and contributions are not eligible for Gift Aid.</p>
      </LegalSection>

      <LegalSection heading="3. Recipient and use of funds">
        <p>Contributions are received by John White.</p>
        <p>
          Contributions may be used by John White at his sole discretion for
          any lawful purpose, including operating, developing, maintaining or
          promoting ONE MILLION. No specific use of the funds is promised,
          and contributors have no right to direct how the funds are used.
        </p>
      </LegalSection>

      <LegalSection heading="4. No ownership, return or guaranteed benefit">
        <p>
          Making a contribution does not provide ownership, equity, voting
          rights, repayment rights, investment returns, rewards or any other
          guaranteed benefit.
        </p>
        <p>
          The only intended effect of a successful contribution on the
          website is to increase the publicly displayed contribution total
          and, where selected, record the contributor&apos;s display name or
          anonymous position.
        </p>
      </LegalSection>

      <LegalSection heading="5. Payment processing">
        <p>Payments are processed by Stripe.</p>
        <p>
          Payment information is entered directly through Stripe&apos;s
          hosted payment service. ONE MILLION does not receive or store full
          card numbers, card security codes or complete payment credentials.
        </p>
        <p>A contribution only counts towards the public total after Stripe confirms that the payment has succeeded.</p>
        <p>Pending, cancelled or failed payments are not included in the total.</p>
      </LegalSection>

      <LegalSection heading="6. Public names and positions">
        <p>A contributor may choose to display a name or contribute anonymously.</p>
        <p>
          You must not submit a name or other content that is unlawful,
          fraudulent, abusive, threatening, discriminatory, harassing,
          misleading or otherwise inappropriate.
        </p>
        <p>
          ONE MILLION may remove or replace an inappropriate display name
          without removing the associated contribution from the total.
        </p>
        <p>A contributor number or position does not provide ownership or any special legal or financial rights.</p>
      </LegalSection>

      <LegalSection heading="7. Campaign suspension or closure">
        <p>
          ONE MILLION may be paused, changed, suspended or permanently closed
          at any time, including before or after the displayed target is
          reached.
        </p>
        <p>
          Pausing the website prevents new contributions from being started
          but may not stop a payment already being processed by Stripe.
        </p>
        <p>There is no promise that the website will remain available permanently or that the displayed target will be reached.</p>
      </LegalSection>

      <LegalSection heading="8. Prohibited use">
        <p>
          You must not use ONE MILLION for fraud, money laundering, payment
          abuse, unauthorised transactions, unlawful activity, interference
          with the website, automated attacks or attempts to access systems
          or information without permission.
        </p>
        <p>Suspicious activity may be blocked, investigated or reported to Stripe, financial institutions or relevant authorities.</p>
      </LegalSection>

      <LegalSection heading="9. Intellectual property">
        <p>The ONE MILLION name, website design, written content and software belong to their respective owners.</p>
        <p>Nothing in these terms transfers intellectual-property ownership to a contributor.</p>
      </LegalSection>

      <LegalSection heading="10. Availability and changes">
        <p>
          ONE MILLION is an experimental and evolving project. Features,
          wording, design, availability and the campaign may change without
          notice.
        </p>
        <p>Although reasonable steps are taken to keep the displayed total accurate, temporary delays or errors may occur.</p>
      </LegalSection>

      <LegalSection heading="11. Limitation of liability">
        <p>
          To the fullest extent permitted by law, ONE MILLION and John White
          will not be liable for indirect or consequential losses, loss of
          profit, loss of opportunity, loss of data or losses arising from
          temporary website unavailability, third-party payment services,
          unauthorised use of a contributor&apos;s payment method or reliance
          on the publicly displayed total.
        </p>
        <p>
          Where liability cannot lawfully be excluded, the total aggregate
          liability arising directly from a contribution will not exceed the
          amount of that contribution.
        </p>
        <p>
          Nothing in these terms excludes or limits liability for death or
          personal injury caused by negligence, fraud, fraudulent
          misrepresentation or any other liability that cannot legally be
          excluded or limited.
        </p>
      </LegalSection>

      <LegalSection heading="12. Refunds">
        <p>Contributions are subject to the Refund Policy published on this website.</p>
        <p>
          Contributions are normally final and non-refundable unless a
          genuine payment mistake occurred, the payment was unauthorised or
          fraudulent, or a refund is required by law.
        </p>
      </LegalSection>

      <LegalSection heading="13. Governing law and jurisdiction">
        <p>These terms and any dispute connected with ONE MILLION are governed by the laws of England and Wales.</p>
        <p>
          The courts of England and Wales will have jurisdiction over
          disputes, except where applicable consumer law gives an individual
          a mandatory right to bring proceedings elsewhere.
        </p>
      </LegalSection>

      <LegalSection heading="14. Changes to these terms">
        <p>
          These terms may be updated when the project, payment process or
          legal requirements change. The date shown at the top of the page
          indicates the latest revision.
        </p>
        <p>Changes apply from the time they are published and do not retrospectively remove rights that have already arisen.</p>
      </LegalSection>

      <LegalSection heading="15. Contact">
        <p>Questions about ONE MILLION or these terms should be sent to:</p>
        <p>millionproject1m@gmail.com</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
