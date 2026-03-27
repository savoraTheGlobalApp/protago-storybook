import { PolicyLayout, Section } from './PolicyLayout';

export function RefundPage() {
  return (
    <PolicyLayout title="Refund & Cancellation Policy">
      <p className="mb-8" style={{ color: '#555' }}>
        Each Protago storybook is custom-made for your child. Please read this policy carefully before placing your order.
      </p>

      <Section title="1. Cancellations">
        <p>Since each book is uniquely generated for your child, cancellations are not possible once an order has been placed and work has begun. We encourage you to review your order details carefully before completing payment.</p>
        <p className="mt-3">If you have any concerns before placing an order, please reach out to us at <a href="mailto:hello@protago.in" style={{ color: '#FF6B35' }}>hello@protago.in</a> first.</p>
      </Section>

      <Section title="2. Refunds">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Digital PDF:</strong> Refunds are not applicable once the PDF has been delivered to your email, as the product has been consumed.</li>
          <li><strong>Printed book – damaged in transit:</strong> Please email a photo of the damaged book within 48 hours of receipt. We will arrange a free replacement at no extra cost.</li>
          <li><strong>Quality issues:</strong> If the book does not match your order (wrong name, theme, or significant print quality defects), contact us within 7 days of receipt for a full refund or reprint.</li>
        </ul>
      </Section>

      <Section title="3. Non-Refundable Situations">
        <ul className="list-disc pl-5 space-y-2">
          <li>Change of mind after the order has been placed.</li>
          <li>Incorrect information (name, age, theme) provided at the time of ordering.</li>
          <li>Low-quality photos submitted that we warned may affect the final output.</li>
          <li>Delays caused by incorrect delivery addresses provided by the customer.</li>
        </ul>
      </Section>

      <Section title="4. Refund Process">
        <p>Approved refunds are processed within 5–7 business days to the original payment method. Razorpay processing time may add an additional 2–3 business days.</p>
      </Section>

      <Section title="5. How to Raise a Refund Request">
        <p>Email us at <a href="mailto:hello@protago.in" style={{ color: '#FF6B35' }}>hello@protago.in</a> with:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Your order ID</li>
          <li>Reason for refund</li>
          <li>Relevant photos (if applicable)</li>
        </ul>
        <p className="mt-3">Our team will respond within 48 hours.</p>
      </Section>
    </PolicyLayout>
  );
}
