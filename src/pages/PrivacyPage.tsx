import { PolicyLayout, Section } from './PolicyLayout';

export function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy">
      <p className="mb-8" style={{ color: '#555' }}>
        Protago ("we", "us") is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.
      </p>

      <Section title="1. Information We Collect">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Personal details:</strong> Parent/guardian name, email address, phone number, and delivery address.</li>
          <li><strong>Child information:</strong> Child's first name, age, gender — used solely to personalise the story.</li>
          <li><strong>Photos:</strong> Photos you upload of your child, used exclusively to generate the personalised illustrations.</li>
          <li><strong>Payment data:</strong> We do not store card details. Payments are handled by Razorpay in accordance with PCI-DSS standards.</li>
          <li><strong>Usage data:</strong> Standard web analytics (pages visited, device type) to improve our service.</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-2">
          <li>To create and deliver your personalised storybook.</li>
          <li>To send order confirmation, updates, and delivery notifications.</li>
          <li>To respond to your support queries.</li>
          <li>To improve our products and website experience.</li>
          <li>We will never sell your data to third parties.</li>
        </ul>
      </Section>

      <Section title="3. Children's Privacy">
        <p>We take children's privacy very seriously. Photos and names of children are used solely for generating the ordered storybook and are not shared with third parties, used in advertising, or stored beyond the period required to fulfil your order (maximum 90 days after delivery).</p>
      </Section>

      <Section title="4. Data Sharing">
        <p>We share data only with trusted service providers necessary to operate our service (e.g., cloud hosting, courier partners, payment processors). All third parties are contractually bound to keep your data secure and use it only for the specified purpose.</p>
      </Section>

      <Section title="5. Data Retention">
        <p>Order records are retained for 3 years for accounting and legal compliance. Child photos are deleted within 90 days of order fulfilment. You may request earlier deletion by contacting us.</p>
      </Section>

      <Section title="6. Your Rights">
        <ul className="list-disc pl-5 space-y-2">
          <li>Access the personal data we hold about you.</li>
          <li>Request correction or deletion of your data.</li>
          <li>Withdraw consent for marketing communications at any time.</li>
        </ul>
        <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:hello@protago.in" style={{ color: '#FF6B35' }}>hello@protago.in</a>.</p>
      </Section>

      <Section title="7. Cookies">
        <p>We use essential cookies to operate the website and optional analytics cookies to understand usage. You can disable non-essential cookies in your browser settings.</p>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>We may update this policy periodically. Changes will be posted on this page with a revised date.</p>
      </Section>

      <Section title="9. Contact">
        <p>For privacy-related queries: <a href="mailto:hello@protago.in" style={{ color: '#FF6B35' }}>hello@protago.in</a></p>
      </Section>
    </PolicyLayout>
  );
}
