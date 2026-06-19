import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

const C = {
  saffron:  '#FF6B35',
  gold:     '#F7B731',
  navy:     '#1A1A2E',
  white:    '#FFFFFF',
  warmTint: '#FFF8F3',
  gray:     '#555555',
  lgray:    '#999999',
};

export function CustomStoryPage() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const navigate = useNavigate();
  const CUSTOM_PRICE = 1980;

  const [form, setForm] = useState({
    parentName: '', email: '', phone: '', childName: '', childAge: '',
    childGender: '', customStoryBrief: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '',
  });
  const [photo, setPhoto] = useState<{ preview: string; uploading: boolean; uploadedPath: string | null; signedUrl: string | null } | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discountAmount: number; finalPrice: number; discountType: string; discountValue: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const displayPrice = coupon ? coupon.finalPrice : CUSTOM_PRICE;

  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/validate-coupon`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), isCustomStory: true }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCoupon({ code: couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, finalPrice: data.finalPrice, discountType: data.discountType, discountValue: data.discountValue });
        setCouponError('');
      } else {
        setCoupon(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch { setCouponError('Could not validate coupon. Try again.'); }
    setCouponLoading(false);
  };

  const inp = (style?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', ...style,
  });
  const lbl: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em',
  };

  const handlePhotoChange = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setPhoto({ preview, uploading: true, uploadedPath: null, signedUrl: null });
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${API_BASE}/api/upload-photo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: base64 }),
      });
      const data = await res.json();
      setPhoto({ preview, uploading: false, uploadedPath: data.photo_url || null, signedUrl: data.photo_signed_url || null });
    } catch {
      setPhoto(prev => prev ? { ...prev, uploading: false } : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.phone || !form.childName || !form.customStoryBrief) return;
    if (!photo?.uploadedPath) { setError("Please upload your child's photo"); return; }
    if (!form.addressLine1 || !form.city || !form.state || !form.pincode) {
      setError('Please fill in the full delivery address'); return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/order-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isCustomStory: true, photoPath: photo?.uploadedPath || null, photoSignedUrl: photo?.signedUrl || null, couponCode: coupon?.code || null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to submit'); }
      const { orderId, razorpayKeyId, amount, currency } = await res.json();

      if (!razorpayKeyId || razorpayKeyId.includes('your_')) {
        navigate('/order-confirmed', { state: { childName: form.childName, email: form.email, amount: CUSTOM_PRICE } });
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId, amount, currency,
        name: 'Protago',
        description: `Custom Story for ${form.childName}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            fetch(`${API_BASE}/api/order/send-confirmation-email`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpayOrderId: response.razorpay_order_id }),
            }).catch(() => {});
            navigate('/order-confirmed', { state: { childName: form.childName, email: form.email, amount: amount / 100 } });
          } catch {
            setError('Payment verification failed. Please contact support.');
          } finally {
            setSubmitting(false);
          }
        },
        prefill: { name: form.parentName, email: form.email, contact: form.phone },
        theme: { color: C.saffron },
        modal: { ondismiss: () => { setSubmitting(false); setError('Payment was cancelled. Please try again.'); } },
      };
      new window.Razorpay(options).open();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Nunito', sans-serif", background: C.warmTint }}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
      <NavBar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 20px 80px' }}>

        {/* Back link */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.lgray, textDecoration: 'none', marginBottom: 32 }}>
          ← Back to home
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ display: 'inline-block', background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 20, padding: '4px 14px', marginBottom: 16 }}>
            Custom Story
          </span>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 5vw, 40px)', color: C.navy, margin: '0 0 14px', lineHeight: 1.2 }}>
            Your story, your rules
          </h1>
          <p style={{ fontSize: 16, color: C.gray, lineHeight: 1.65, maxWidth: 520, margin: '0 auto 20px' }}>
            Have a unique idea — a birthday adventure, a family trip, a lesson you want them to live?
            Share the brief and we'll write &amp; illustrate it completely bespoke.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' as const }}>
            {[['📚', 'Paperback print'], ['📦', 'Delivered in 5–7 days'], ['✏️', 'Custom written & illustrated']].map(([icon, text]) => (
              <span key={text} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.navy, background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 50, padding: '5px 14px' }}>
                {icon} {text}
              </span>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', padding: '32px 28px', border: '1px solid #F0EEE8' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Parent details */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Your details</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {([['parentName', 'Your name', 'Priya Sharma', 'text'], ['email', 'Email *', 'you@email.com', 'email']] as [string,string,string,string][]).map(([key, label, placeholder, type]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <input required={label.includes('*')} type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                      onChange={e => set(key, e.target.value)}
                      onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      style={inp()} />
                  </div>
                ))}
                <div>
                  <label style={lbl}>WhatsApp *</label>
                  <div style={{ display: 'flex', border: '1.5px solid #E5E7EB', borderRadius: 9, overflow: 'hidden', background: '#fff' }}>
                    <span style={{ padding: '10px 10px', fontSize: 14, fontWeight: 700, color: C.gray, background: '#F9FAFB', borderRight: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center' }}>+91</span>
                    <input required type="tel" placeholder="98765 43210" maxLength={10}
                      value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      style={{ border: 'none', padding: '10px 12px', fontSize: 14, outline: 'none', flex: 1, fontFamily: 'inherit', background: 'transparent' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Child info */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Child's details</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={lbl}>Name *</label>
                  <input required placeholder="Arjun" value={form.childName} onChange={e => set('childName', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    style={inp()} />
                </div>
                <div>
                  <label style={lbl}>Age</label>
                  <select value={form.childAge} onChange={e => set('childAge', e.target.value)} style={inp({ background: '#fff' })}>
                    <option value="">Age</option>
                    {Array.from({ length: 10 }, (_, i) => i + 3).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Gender</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Boy', 'Girl'].map(g => (
                      <button type="button" key={g} onClick={() => set('childGender', g)}
                        style={{ padding: '10px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${form.childGender === g ? C.saffron : '#E5E7EB'}`, background: form.childGender === g ? '#FFF3EE' : '#fff', color: form.childGender === g ? C.saffron : '#9CA3AF' }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Child photo */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Child's photo</p>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.lgray, textAlign: 'center', margin: '0 0 8px' }}>Tips</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[
                    { img: '/photo-tips/good.avif',       label: 'Clear front-facing', good: true },
                    { img: '/photo-tips/group.jpg',       label: 'Only one person',    good: false },
                    { img: '/photo-tips/sunglasses.avif', label: 'No accessories',     good: false },
                    { img: '/photo-tips/sideangle.jpg',   label: 'No side angle',      good: false },
                  ].map(({ img, label, good }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ position: 'relative', width: 52, height: 52 }}>
                        <img src={img} alt={label} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `2.5px solid ${good ? '#22C55E' : '#EF4444'}` }} />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: good ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 800, border: '1.5px solid #fff' }}>
                          {good ? '✓' : '✕'}
                        </div>
                      </div>
                      <p style={{ fontSize: 8, color: C.gray, textAlign: 'center', lineHeight: 1.3, margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {photo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={photo.preview} alt="Child" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '2px solid #E5E7EB' }} />
                  <div style={{ flex: 1 }}>
                    {photo.uploading
                      ? <p style={{ fontSize: 13, color: C.lgray, margin: 0 }}>Uploading…</p>
                      : <p style={{ fontSize: 13, color: '#22C55E', fontWeight: 700, margin: 0 }}>✓ Photo uploaded</p>}
                  </div>
                  <button type="button" onClick={() => setPhoto(null)}
                    style={{ background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.gray, cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px', border: '2px dashed #E5E7EB', borderRadius: 12, cursor: 'pointer', background: '#FAFAFA' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.saffron)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                  <span style={{ fontSize: 34 }}>📸</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Upload child's photo</span>
                  <span style={{ fontSize: 11, color: C.lgray }}>Clear, front-facing · JPG or PNG</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f); }} />
                </label>
              )}
            </div>

            {/* Story brief */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Your story idea</p>
              <textarea required rows={5} value={form.customStoryBrief} onChange={e => set('customStoryBrief', e.target.value)}
                placeholder="e.g. Arjun's 5th birthday — he loves dinosaurs and wants to be a palaeontologist. The story should show him on a dig discovering a new species, learning that patience pays off, and naming it after his little sister..."
                onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                style={{ ...inp(), resize: 'vertical', lineHeight: 1.6 }} />
              <p style={{ fontSize: 13, color: C.lgray, margin: '4px 0 0' }}>Characters · setting · the lesson · any real names or places — more detail = better book</p>
            </div>

            {/* Delivery address */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Delivery address</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={lbl}>Address line 1 *</label>
                  <input required placeholder="House / flat / building" value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    style={inp()} />
                </div>
                <div>
                  <label style={lbl}>Address line 2</label>
                  <input placeholder="Street / area / landmark" value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    style={inp()} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 10 }}>
                  <div>
                    <label style={lbl}>City *</label>
                    <input required placeholder="Mumbai" value={form.city} onChange={e => set('city', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      style={inp()} />
                  </div>
                  <div>
                    <label style={lbl}>State *</label>
                    <input required placeholder="Maharashtra" value={form.state} onChange={e => set('state', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      style={inp()} />
                  </div>
                  <div>
                    <label style={lbl}>Pincode *</label>
                    <input required placeholder="400001" maxLength={6} value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      style={inp()} />
                  </div>
                </div>
              </div>
            </div>

            {error && <p style={{ fontSize: 13, color: '#C0392B', margin: 0 }}>{error}</p>}

            {/* Promo code */}
            <div>
              <label style={{ ...lbl }}>Promo code (optional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="e.g. WELCOME20"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCoupon(null); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCoupon())}
                  style={{ ...inp(), flex: 1, width: 'auto' }}
                />
                <button type="button" onClick={handleCoupon} disabled={couponLoading || !couponInput.trim()}
                  style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: couponLoading || !couponInput.trim() ? 0.5 : 1 }}>
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
              {coupon && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FFF4', border: '1.5px solid #22C55E', borderRadius: 8, padding: '7px 11px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
                    ✓ {coupon.code} — {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `₹${coupon.discountAmount} off`}
                  </span>
                  <button type="button" onClick={() => { setCoupon(null); setCouponInput(''); }}
                    style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
              )}
              {couponError && <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0' }}>{couponError}</p>}
            </div>

            {/* Pricing */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', background: '#FFF7ED', borderRadius: 12, border: '1px solid #FFE4CC' }}>
              {coupon ? (
                <>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#22C55E', borderRadius: 50, padding: '2px 10px' }}>
                    {coupon.discountType === 'percent' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountAmount} OFF`}
                  </span>
                  <span style={{ fontSize: 18, color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600 }}>₹2,200</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: "'Baloo 2', sans-serif" }}>₹{coupon.finalPrice.toLocaleString('en-IN')}</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#22C55E', borderRadius: 50, padding: '2px 10px' }}>10% OFF</span>
                  <span style={{ fontSize: 18, color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600 }}>₹2,200</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: "'Baloo 2', sans-serif" }}>Starting ₹1,980</span>
                </>
              )}
            </div>

            <button type="submit" disabled={submitting || !!photo?.uploading || !photo?.uploadedPath}
              style={{
                background: (submitting || photo?.uploading || !photo?.uploadedPath) ? '#E5E7EB' : `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`,
                color: (submitting || photo?.uploading || !photo?.uploadedPath) ? '#9CA3AF' : '#fff',
                border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 800, fontSize: 16,
                cursor: (submitting || photo?.uploading || !photo?.uploadedPath) ? 'default' : 'pointer',
                fontFamily: "'Baloo 2', sans-serif",
                boxShadow: (submitting || photo?.uploading || !photo?.uploadedPath) ? 'none' : '0 4px 16px rgba(255,107,53,0.4)',
              }}>
              {photo?.uploading ? 'Uploading photo…' : submitting ? 'Processing…' : `Pay ₹${displayPrice.toLocaleString('en-IN')} & Order →`}
            </button>
            <p style={{ fontSize: 11, color: C.lgray, textAlign: 'center', margin: '-8px 0 0' }}>
              Secure payment · We'll contact you within 24 hours to finalise the story
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
