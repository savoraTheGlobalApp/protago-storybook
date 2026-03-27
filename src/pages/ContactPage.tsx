import { PolicyLayout } from './PolicyLayout';

const C = { saffron: '#FF6B35', gold: '#F7B731', navy: '#1A1A2E' };

export function ContactPage() {
  return (
    <PolicyLayout title="Contact Us">
      <p className="mb-10" style={{ color: '#555' }}>
        We'd love to hear from you — whether it's a question about your order, feedback, or just saying hello!
      </p>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <div className="rounded-2xl p-6" style={{ background: '#FFF8F3', border: '1px solid #FFE0D0' }}>
          <div className="text-2xl mb-3">✉️</div>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, color: C.navy }} className="text-lg mb-1">Email</h3>
          <a href="mailto:hello@protago.in" style={{ color: C.saffron }} className="font-semibold hover:opacity-75 transition-opacity">
            hello@protago.in
          </a>
          <p className="text-sm mt-2" style={{ color: '#777' }}>We respond within 24 hours on business days.</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#FFF8F3', border: '1px solid #FFE0D0' }}>
          <div className="text-2xl mb-3">💬</div>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, color: C.navy }} className="text-lg mb-1">WhatsApp</h3>
          <p className="font-semibold" style={{ color: C.saffron }}>Available on request</p>
          <p className="text-sm mt-2" style={{ color: '#777' }}>Message us on WhatsApp for order updates and quick queries.</p>
        </div>
      </div>

      {/* Address — required by Razorpay */}
      <div className="rounded-2xl p-6 mb-10" style={{ background: C.navy, color: 'white' }}>
        <div className="text-2xl mb-3">📍</div>
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, color: C.gold }} className="text-lg mb-3">Registered Address</h3>
        <address style={{ fontStyle: 'normal', lineHeight: 2, color: 'rgba(255,255,255,0.8)' }}>
          <strong style={{ color: 'white' }}>Protago</strong><br />
          No. 123, 1st Floor, Koramangala 5th Block,<br />
          Bengaluru, Karnataka – 560 095<br />
          India<br />
          <br />
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>CIN: (to be updated)</span>
        </address>
      </div>

      {/* Business hours */}
      <div className="rounded-2xl p-6" style={{ background: '#F8F8FF', border: '1px solid #E8E8F0' }}>
        <div className="text-2xl mb-3">🕐</div>
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, color: C.navy }} className="text-lg mb-3">Business Hours</h3>
        <div className="space-y-2 text-sm" style={{ color: '#555' }}>
          <div className="flex justify-between max-w-xs">
            <span>Monday – Friday</span>
            <span className="font-semibold">10:00 AM – 6:00 PM IST</span>
          </div>
          <div className="flex justify-between max-w-xs">
            <span>Saturday</span>
            <span className="font-semibold">10:00 AM – 2:00 PM IST</span>
          </div>
          <div className="flex justify-between max-w-xs">
            <span>Sunday & Public Holidays</span>
            <span className="font-semibold">Closed</span>
          </div>
        </div>
      </div>
    </PolicyLayout>
  );
}
