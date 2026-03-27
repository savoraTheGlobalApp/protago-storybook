import { PolicyLayout, Section } from './PolicyLayout';

export function TermsPage() {
  return (
    <PolicyLayout title="Terms & Conditions">
      <Section title="1. Acceptance of Terms">
        <p>By placing an order or using the Protago website (protago.in), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.</p>
      </Section>

      <Section title="2. About Our Service">
        <p>Protago is a personalised children's storybook service operated by Protago We create custom illustrated storybooks featuring your child's likeness, name, and chosen theme. Each book is made-to-order and unique to the child.</p>
      </Section>

      <Section title="3. Orders & Payment">
        <ul className="list-disc pl-5 space-y-2">
          <li>All orders are subject to acceptance and availability.</li>
          <li>Prices are listed in Indian Rupees (INR) and are inclusive of GST unless stated otherwise.</li>
          <li>Payment is processed securely via Razorpay. We accept UPI, debit/credit cards, and net banking.</li>
          <li>Your order is confirmed only upon successful payment.</li>
        </ul>
      </Section>

      <Section title="4. Photo & Content Submission">
        <ul className="list-disc pl-5 space-y-2">
          <li>You must have the rights to any photos you submit. By submitting a photo, you grant us a limited licence to use it solely for creating your ordered storybook.</li>
          <li>We will not use your child's photo for any marketing or third-party purpose without your explicit written consent.</li>
          <li>We reserve the right to reject photos that are of insufficient quality, inappropriate, or violate our guidelines.</li>
        </ul>
      </Section>

      <Section title="5. Intellectual Property">
        <p>All artwork, illustrations, story content, and design elements created by Protago remain the intellectual property of Protago The personalised book is licensed for personal use only and may not be reproduced, resold, or distributed commercially.</p>
      </Section>

      <Section title="6. Delivery">
        <ul className="list-disc pl-5 space-y-2">
          <li>Digital PDF orders are delivered to your registered email within the timeframe specified at checkout.</li>
          <li>Printed books are shipped via courier. Estimated delivery timelines are provided at checkout and may vary.</li>
          <li>We are not responsible for delays caused by courier partners or incorrect delivery addresses provided by the customer.</li>
        </ul>
      </Section>

      <Section title="7. Limitation of Liability">
        <p>To the fullest extent permitted by law, Protago shall not be liable for any indirect, incidental, or consequential damages arising from the use of our service. Our total liability shall not exceed the amount paid for the specific order in question.</p>
      </Section>

      <Section title="8. Governing Law">
        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.</p>
      </Section>

      <Section title="9. Contact">
        <p>For any queries regarding these terms, please write to us at <a href="mailto:hello@protago.in" style={{ color: '#FF6B35' }}>hello@protago.in</a>.</p>
      </Section>
    </PolicyLayout>
  );
}
