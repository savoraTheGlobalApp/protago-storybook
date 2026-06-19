import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const C = { saffron: '#FF6B35', navy: '#1A1A2E' };

const THEME_PRICE_OVERRIDES: Record<string, { paperback: number; hardcover: number }> = {
  'abc':            { paperback: 849, hardcover: 1399 },
  'hindi-alphabet': { paperback: 849, hardcover: 1399 },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  childAge: string;
  childGender: string;
  bindingType: string;
  themeSlug: string;
  themeName: string;
  photoPath: string;
  photoSignedUrl?: string;
  pbPrice: number;
  hcPrice: number;
  apiBase: string;
}

export function OrderCompletionOverlay({
  isOpen, onClose,
  parentName, email, phone, childName, childAge, childGender,
  bindingType, themeSlug, themeName, photoPath, photoSignedUrl,
  pbPrice, hcPrice, apiBase,
}: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', dedicationMessage: '', couponInput: '' });
  const [coupon, setCoupon] = useState<{ code: string; discountAmount: number; finalPrice: number; discountType: string; discountValue: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const override = THEME_PRICE_OVERRIDES[themeSlug] || null;
  const basePrice = override
    ? (bindingType === 'hardcover' ? override.hardcover : override.paperback)
    : bindingType === 'hardcover' ? hcPrice : pbPrice;
  const displayPrice = coupon ? coupon.finalPrice : basePrice;

  const handleCoupon = async () => {
    if (!form.couponInput.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/validate-coupon`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: form.couponInput.trim(), theme: themeSlug, bindingType }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCoupon({ code: form.couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, finalPrice: data.finalPrice, discountType: data.discountType, discountValue: data.discountValue });
        setCouponError('');
      } else {
        setCoupon(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch { setCouponError('Could not validate coupon. Try again.'); }
    setCouponLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/order-inquiry`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName, email, phone,
          childName, childAge, childGender,
          storyTheme: themeSlug,
          bindingType,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          dedicationMessage: form.dedicationMessage,
          photoPath,
          photoSignedUrl: photoSignedUrl || null,
          couponCode: coupon?.code || null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to create order'); }
      const { orderId, razorpayKeyId, amount, currency } = await res.json();

      if (!razorpayKeyId || razorpayKeyId.includes('your_')) {
        navigate('/order-confirmed', { state: { childName, email, amount: amount / 100 } });
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId, amount, currency,
        name: 'Protago',
        description: `Personalised Storybook — ${themeName}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${apiBase}/api/verify-payment`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            fetch(`${apiBase}/api/order/send-confirmation-email`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpayOrderId: response.razorpay_order_id }),
            }).catch(() => {});
            navigate('/order-confirmed', { state: { childName, email, amount: amount / 100 } });
          } catch {
            setError('Payment verification failed. Please contact support.');
            setSubmitting(false);
          }
        },
        prefill: { name: parentName, email, contact: phone },
        theme: { color: '#FF6B35' },
        modal: { ondismiss: () => { setSubmitting(false); setError('Payment was cancelled. Please try again.'); } },
      };
      new window.Razorpay(options).open();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8,
    padding: '9px 11px', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,8,20,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
            style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '28px 24px', fontFamily: "'Nunito', sans-serif", position: 'relative' }}>
            <button onClick={onClose}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9CA3AF', lineHeight: 1 }}>×</button>

            <p style={{ fontSize: 11, fontWeight: 700, color: C.saffron, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Almost there!</p>
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.navy, margin: '0 0 20px', lineHeight: 1.2 }}>Where should we ship it?</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Address */}
              {[
                { key: 'addressLine1', label: 'Address line 1 *', placeholder: 'Flat / House no., Building, Street', required: true },
                { key: 'addressLine2', label: 'Address line 2 (optional)', placeholder: 'Area, Landmark', required: false },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</label>
                  <input required={required} placeholder={placeholder} value={form[key as keyof typeof form]}
                    onChange={e => setF(key, e.target.value)} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ key: 'city', label: 'City *', placeholder: 'e.g. Mumbai' }, { key: 'state', label: 'State *', placeholder: 'e.g. Maharashtra' }].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</label>
                    <input required placeholder={placeholder} value={form[key as keyof typeof form]}
                      onChange={e => setF(key, e.target.value)} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Pincode *</label>
                <input required placeholder="e.g. 400001" inputMode="numeric" maxLength={6} pattern="[0-9]{6}"
                  value={form.pincode} onChange={e => setF('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} style={inputStyle} />
              </div>

              {/* Dedication */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Personal message <span style={{ color: '#C4B5A0', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea placeholder={`e.g. "To my little star — with all my love, ${parentName || 'Mama'}"`}
                  value={form.dedicationMessage} onChange={e => setF('dedicationMessage', e.target.value)}
                  rows={2} maxLength={200}
                  style={{ ...inputStyle, resize: 'none' }} />
                <p style={{ fontSize: 10, color: '#9CA3AF', margin: '3px 0 0' }}>🎬 Printed on the first page of the book</p>
              </div>

              {/* Coupon */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Promo code (optional)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="e.g. WELCOME20" value={form.couponInput}
                    onChange={e => { setF('couponInput', e.target.value.toUpperCase()); setCoupon(null); setCouponError(''); }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCoupon())}
                    style={{ ...inputStyle, flex: 1, width: 'auto' }} />
                  <button type="button" onClick={handleCoupon} disabled={couponLoading || !form.couponInput.trim()}
                    style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: couponLoading || !form.couponInput.trim() ? 0.5 : 1 }}>
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {coupon && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FFF4', border: '1.5px solid #22C55E', borderRadius: 8, padding: '7px 11px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
                      ✓ {coupon.code} — {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `₹${coupon.discountAmount} off`}
                    </span>
                    <button type="button" onClick={() => { setCoupon(null); setF('couponInput', ''); }}
                      style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}
                {couponError && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0' }}>{couponError}</p>}
              </div>

              {/* Consent */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}
                  style={{ marginTop: 2, flexShrink: 0, accentColor: C.saffron, width: 15, height: 15, cursor: 'pointer' }} />
                <span style={{ fontSize: 11, lineHeight: 1.6, color: '#9CA3AF' }}>
                  I confirm I am 18+ and have obtained parental consent per the{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.saffron, textDecoration: 'underline' }}>Privacy Policy</a>.
                </span>
              </label>

              {error && <p style={{ fontSize: 12, color: '#EF4444', margin: '0', textAlign: 'center' }}>{error}</p>}

              <button type="submit" disabled={submitting || !consent}
                style={{ background: consent ? `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)` : '#E5E7EB', color: consent ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 800, fontSize: 16, cursor: consent ? 'pointer' : 'default', fontFamily: "'Baloo 2', sans-serif", boxShadow: consent ? '0 4px 16px rgba(255,107,53,0.4)' : 'none' }}>
                {submitting ? 'Processing…' : `Pay ₹${displayPrice.toLocaleString('en-IN')} & Order →`}
              </button>
              <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', margin: '-4px 0 0' }}>
                {bindingType === 'hardcover' ? 'Hardcover' : 'Paperback'} · Delivered in 7–9 business days
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
