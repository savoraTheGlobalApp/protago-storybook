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

      <Section title="5. Sharing of Data with Meta Platforms">
        <p className="mb-3"><em>Last updated: 25th May 2026</em></p>
        <p className="mb-3">As part of our efforts to improve our advertising and better reach customers who may be interested in our products, Protago AI uses Meta's Business Tools, including WhatsApp Business, to share certain customer-related activity data with Meta Platforms, Inc.</p>
        <p className="mb-2"><strong>What data is shared:</strong></p>
        <p className="mb-3">We may share transactional and interaction signals with Meta, such as when an order is created, updated, or completed. This data is shared at an aggregate or event level to help Meta optimise ad delivery. Message and call content is never shared.</p>
        <p className="mb-2"><strong>Why we share this data:</strong></p>
        <p className="mb-3">This data sharing helps us show our ads to people who are more likely to be interested in our products on Facebook and Instagram, and improves the overall relevance of ads served to our customers and potential customers.</p>
        <p className="mb-2"><strong>Third-party data handling:</strong></p>
        <p className="mb-3">Data shared with Meta is governed by Meta's own Privacy Policy, available at <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" style={{ color: '#FF6B35' }}>facebook.com/privacy/policy</a>. We encourage you to review Meta's privacy practices.</p>
        <p className="mb-2"><strong>Your rights and choices:</strong></p>
        <p className="mb-2">You have the right to request that your data not be shared with Meta. To opt out:</p>
        <ul className="list-disc pl-5 space-y-2 mb-3">
          <li>Email us at <a href="mailto:hello@protago.in" style={{ color: '#FF6B35' }}>hello@protago.in</a></li>
          <li>Send us a message on WhatsApp at <a href="https://wa.me/919606037934" style={{ color: '#FF6B35' }}>+91 96060 37934</a></li>
        </ul>
        <p>We will update your preferences in our systems within 7–10 business days.</p>
      </Section>

      <Section title="6. Data Retention">
        <p>Order records are retained for 3 years for accounting and legal compliance. Child photos are deleted within 90 days of order fulfilment. You may request earlier deletion by contacting us.</p>
      </Section>

      <Section title="7. Your Rights">
        <ul className="list-disc pl-5 space-y-2">
          <li>Access the personal data we hold about you.</li>
          <li>Request correction or deletion of your data.</li>
          <li>Withdraw consent for marketing communications at any time.</li>
        </ul>
        <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:hello@protago.in" style={{ color: '#FF6B35' }}>hello@protago.in</a>.</p>
      </Section>

      <Section title="8. Cookies">
        <p>We use essential cookies to operate the website and optional analytics cookies to understand usage. You can disable non-essential cookies in your browser settings.</p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>We may update this policy periodically. Changes will be posted on this page with a revised date.</p>
      </Section>

      <Section title="10. Contact">
        <p>For privacy-related queries: <a href="mailto:hello@protago.in" style={{ color: '#FF6B35' }}>hello@protago.in</a></p>
      </Section>
    </PolicyLayout>
  );
}
