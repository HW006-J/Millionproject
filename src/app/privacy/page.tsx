import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — ONE MILLION",
  description: "How ONE MILLION collects and uses personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <LegalSection heading="Introduction">
        <p>
          This Privacy Policy explains how personal information is collected
          and used when you visit ONE MILLION, make a contribution or contact
          the project.
        </p>
        <p>The person responsible for the handling of personal information for this project is John White.</p>
        <p>Contact: millionproject1m@gmail.com</p>
      </LegalSection>

      <LegalSection heading="1. Information collected">
        <p>Depending on how you use the website, the following information may be processed:</p>
        <ul className="list-disc pl-5">
          <li>The display name you provide or your choice to appear anonymously</li>
          <li>Contribution amount and currency</li>
          <li>Payment status</li>
          <li>Stripe payment, checkout and transaction identifiers</li>
          <li>The date and time of a contribution</li>
          <li>Email address or contact information supplied through Stripe or when contacting the project</li>
          <li>Technical, security and diagnostic information, such as IP address, browser information, request logs and error records</li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. Payment information">
        <p>Payments are processed by Stripe.</p>
        <p>
          Full card numbers and card security codes are entered through
          Stripe&apos;s hosted payment service and are not received or
          stored by ONE MILLION.
        </p>
        <p>Stripe processes payment information under its own terms and privacy policy.</p>
      </LegalSection>

      <LegalSection heading="3. How information is used">
        <p>Personal information may be used to:</p>
        <ul className="list-disc pl-5">
          <li>Process and verify contributions</li>
          <li>Maintain the publicly displayed contribution total</li>
          <li>Display a contributor name when requested</li>
          <li>Investigate failed, duplicate, fraudulent or disputed payments</li>
          <li>Process an approved refund</li>
          <li>Secure, maintain and troubleshoot the website</li>
          <li>Respond to questions or data-rights requests</li>
          <li>Meet accounting, tax, fraud-prevention and other legal obligations</li>
        </ul>
        <p>Personal information will not be used for unrelated marketing unless the individual has separately and clearly agreed to it.</p>
      </LegalSection>

      <LegalSection heading="4. Public information">
        <p>A display name submitted for publication may be visible to anyone visiting the website.</p>
        <p>Contributors can choose to appear anonymously instead. Payment details, email addresses and Stripe identifiers are not intentionally displayed publicly.</p>
      </LegalSection>

      <LegalSection heading="5. Sharing information">
        <p>Information may be shared only where reasonably necessary with service providers involved in operating the project, including:</p>
        <ul className="list-disc pl-5">
          <li>Stripe for payment processing</li>
          <li>Vercel for website hosting and delivery</li>
          <li>Neon for database hosting</li>
          <li>Technical, accounting or legal advisers where required</li>
          <li>Banks, payment networks, regulators, courts or law-enforcement authorities where legally required or reasonably necessary to prevent fraud</li>
        </ul>
        <p>Service providers may process information under their own privacy terms.</p>
      </LegalSection>

      <LegalSection heading="6. No sale of personal information">
        <p>ONE MILLION and John White will not sell personal information.</p>
        <p>Personal information will also not be rented or provided to third parties for their independent advertising purposes.</p>
      </LegalSection>

      <LegalSection heading="7. Retention">
        <p>Personal information will not be retained for longer than reasonably necessary for the purpose for which it was collected.</p>
        <p>Contribution and transaction records may need to be retained for accounting, tax, fraud-prevention, dispute-resolution or other legal requirements.</p>
        <p>Technical logs and contact information will be deleted or anonymised when they are no longer reasonably required for security, support or legal purposes.</p>
        <p>Retention periods will be reviewed when the project or applicable legal obligations change.</p>
      </LegalSection>

      <LegalSection heading="8. Security">
        <p>Reasonable technical and organisational measures are used to protect information against unauthorised access, loss, alteration or disclosure.</p>
        <p>However, no internet service or storage system can guarantee complete security.</p>
      </LegalSection>

      <LegalSection heading="9. International processing">
        <p>
          Some service providers may process information outside the United
          Kingdom. Where this occurs, information will be handled using the
          safeguards and contractual arrangements provided by those services
          and required by applicable data-protection law.
        </p>
      </LegalSection>

      <LegalSection heading="10. Data rights">
        <p>Depending on the circumstances and applicable law, individuals may have rights to:</p>
        <ul className="list-disc pl-5">
          <li>Request access to their personal information</li>
          <li>Ask for inaccurate information to be corrected</li>
          <li>Request deletion of information</li>
          <li>Request restriction of processing</li>
          <li>Object to certain processing</li>
          <li>Request a portable copy of eligible information</li>
          <li>Withdraw consent where processing is based on consent</li>
        </ul>
        <p>Some information may need to be retained despite a request where there is a legal, accounting, security or fraud-prevention reason.</p>
        <p>Requests should be sent to:</p>
        <p>millionproject1m@gmail.com</p>
        <p>The requester may be asked for reasonable information to confirm their identity and locate the relevant records.</p>
        <p>Individuals may also raise a concern with the UK Information Commissioner&apos;s Office.</p>
      </LegalSection>

      <LegalSection heading="11. Cookies and technical storage">
        <p>
          ONE MILLION uses only technical storage that is reasonably
          necessary to operate and secure the website. Stripe may use
          cookies or similar technology on its hosted payment pages under
          its own policies.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to this policy">
        <p>
          This Privacy Policy may be updated when the project, service
          providers or legal requirements change. The latest revision date
          will be displayed at the top of the page.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact">
        <p>Privacy questions and data-rights requests should be sent to:</p>
        <p>millionproject1m@gmail.com</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
