import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { NavBar } from '../components/NavBar';

const C = {
  navy:    '#1A1A2E',
  saffron: '#FF6B35',
  gold:    '#F7B731',
  gray:    '#555555',
  white:   '#FFFFFF',
  warmTint: '#FDF8F3',
};

export function OrderConfirmedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { childName, email, amount } = (location.state as { childName?: string; email?: string; amount?: number }) || {};

  // Fire Meta Pixel Purchase event as soon as this page loads
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (window as any).fbq === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).fbq('track', 'Purchase', { value: amount ?? 499, currency: 'INR' });
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.warmTint, fontFamily: "'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />

      <NavBar />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ background: C.white, borderRadius: 24, padding: 'clamp(32px, 6vw, 56px) clamp(24px, 6vw, 48px)', maxWidth: 520, width: '100%', textAlign: 'center', border: `2px solid ${C.gold}`, boxShadow: '0 8px 40px rgba(0,0,0,0.07)' }}>

          <p style={{ fontSize: 56, margin: '0 0 12px' }}>🎉</p>

          <p style={{ fontSize: 11, fontWeight: 700, color: C.saffron, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 8px' }}>
            Order confirmed
          </p>

          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.navy, fontSize: 'clamp(1.4rem, 4vw, 2rem)', margin: '0 0 16px', lineHeight: 1.2 }}>
            {childName ? `${childName}'s book is on its way!` : "Your book is on its way!"}
          </h1>

          <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.7, margin: '0 0 32px' }}>
            We've received your order{email && <>, and a confirmation has been sent to <strong>{email}</strong></>}.
            Your personalised storybook will be delivered in <strong>5–7 business days</strong>.
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36, textAlign: 'left' }}>
            {[
              { n: '1', text: `Our AI places ${childName || "your child"}'s face into every scene of the story` },
              { n: '2', text: 'Printed on premium 300GSM glossy paper and carefully packaged' },
              { n: '3', text: 'Delivered to your door in 5–7 business days' },
            ].map(({ n, text }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: C.saffron, color: '#fff', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Baloo 2', sans-serif" }}>{n}</span>
                <p style={{ margin: 0, fontSize: 14, color: C.gray, lineHeight: 1.55, paddingTop: 5 }}>{text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/')}
            style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 50, padding: '14px 36px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: '0 4px 16px rgba(26,26,46,0.2)' }}>
            Back to home
          </button>
        </motion.div>
      </div>

      {/* Footer — matches BrochurePage exactly */}
      <footer style={{ background: C.navy }} className="pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            <div>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.saffron }}>protago</span>
              <p className="text-sm mt-3 leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Magical, personalised storybooks that make every Indian child the hero of their own adventure.
              </p>
              <a href="mailto:hello@protago.in" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity mb-2"
                style={{ color: C.gold, textDecoration: 'none' }}>
                <MessageCircle size={14} /> hello@protago.in
              </a>
              <a href="https://wa.me/919606037934" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm mt-2 hover:opacity-80 transition-opacity"
                style={{ color: C.gold, textDecoration: 'none' }}>
                <MessageCircle size={14} /> WhatsApp: +91 96060 37934
              </a>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Explore</h4>
              <ul className="space-y-3">
                {[['Art Styles', '/#art-styles'], ['How It Works', '/#how-it-works'], ['FAQ', '/#faq'], ['Contact Us', 'mailto:hello@protago.in']].map(([label, href]) => (
                  <li key={href}>
                    <a href={href} className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Secure Payments</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Razorpay', 'UPI', 'Cards', 'Net Banking'].map(p => (
                  <span key={p} className="text-xs font-semibold rounded-full px-3 py-1.5"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{p}</span>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>An initiative by IIT Kanpur alumni</p>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>&copy; {new Date().getFullYear()} Protago. All rights reserved.</span>
            <div className="flex items-center gap-4">
              {[['Privacy Policy', '/privacy'], ['Terms & Conditions', '/terms'], ['Refund Policy', '/refund']].map(([label, href]) => (
                <a key={href} href={href} className="text-xs hover:opacity-60 transition-opacity" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</a>
              ))}
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Made with love in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
