import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { THEMES } from '../data/themes';
import { NavBar } from '../components/NavBar';

const C = {
  saffron: '#FF6B35',
  gold:    '#F7B731',
  navy:    '#1A1A2E',
  white:   '#FFFFFF',
  gray:    '#555555',
  lgray:   '#999999',
};

const FACE_SAMPLES = [
  { key: 'boy_young', face: '/faces/face_boy_young.webp' },
  { key: 'boy_older', face: '/faces/face_boy_older.webp' },
  { key: 'girl',      face: '/faces/face_girl_medium.webp' },
];

export function ThemePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Support two entry paths: navigate() with state (same tab) or window.open() with query params (new tab)
  const locationState = (location.state as { previewUrls?: (string | null)[]; childName?: string; fromPreview?: boolean; gender?: string; ageGroup?: string; age?: string; email?: string } | null)
    ?? (searchParams.get('fromPreview') === 'true' ? {
        fromPreview: true,
        childName:  searchParams.get('name')     || undefined,
        gender:     searchParams.get('gender')   || undefined,
        ageGroup:   searchParams.get('ageGroup') || undefined,
        age:        searchParams.get('age')      || undefined,
        email:      searchParams.get('email')    || undefined,
      } : null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  const theme = THEMES.find(t => t.slug === slug);
  const NINE_PAGE_THEMES = new Set(['colours-shapes', 'bedtime-routines', 'numbers-maths', 'sharing-sorry', 'first-day-school', 'managing-emotions', 'indian-festivals', 'phonics-reading']);
  const previewPageCount = theme && NINE_PAGE_THEMES.has(theme.slug) ? 9 : 4;

  const [activeIdx, setActiveIdx] = useState(0);
  const [childName, setChildName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [previewEmail, setPreviewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [photo, setPhoto] = useState<{ preview: string; uploading: boolean; signedUrl: string | null } | null>(null);
  const [consent, setConsent] = useState(false);
  const [jobStatus, setJobStatus] = useState('');
  const [showOrder, setShowOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ parentName: '', email: '', phone: '', childName: '', childAge: '', childGender: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', notes: '', dedicationMessage: '' });
  const [orderPhoto, setOrderPhoto] = useState<{ preview: string; uploading: boolean; uploadedPath: string | null; signedUrl: string | null } | null>(null);
  const [orderConsent, setOrderConsent] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number; finalPrice: number; discountType: string; discountValue: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [gender, setGender] = useState<'boy' | 'girl' | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<'young' | 'middle' | 'older' | null>(null);
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  const pickAge = (age: number) => {
    setSelectedAge(age);
    setSelectedAgeGroup(age <= 5 ? 'young' : age <= 8 ? 'middle' : 'older');
  };

  // Reset on theme change
  useEffect(() => { setGender(null); setSelectedAgeGroup(null); setSelectedAge(null); }, [slug]);

  useEffect(() => {
    if (locationState?.fromPreview) {
      // Arriving from PreviewResultPage — prefill everything from the preview form
      setShowOrder(true);
      const ls = locationState;
      // Resolve exact age number: prefer the specific age, fall back to ageGroup midpoints
      const exactAge = ls.age ? Number(ls.age) : ls.ageGroup === 'young' ? 4 : ls.ageGroup === 'middle' ? 6 : ls.ageGroup === 'older' ? 10 : null;
      setOrderForm(f => ({
        ...f,
        childName: ls.childName || f.childName,
        email: ls.email || f.email,
        childGender: ls.gender === 'boy' ? 'Boy' : ls.gender === 'girl' ? 'Girl' : f.childGender,
        childAge: exactAge ? String(exactAge) : f.childAge,
      }));
      if (ls.email) setPreviewEmail(ls.email);
      if (ls.gender === 'boy' || ls.gender === 'girl') setGender(ls.gender);
      if (ls.ageGroup === 'young' || ls.ageGroup === 'middle' || ls.ageGroup === 'older') {
        setSelectedAgeGroup(ls.ageGroup);
        setSelectedAge(exactAge);
      }
      setTimeout(() => {
        document.getElementById('inline-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % FACE_SAMPLES.length), 2000);
    return () => clearInterval(t);
  }, []);

  if (!theme) {
    navigate('/');
    return null;
  }

  const AGE_COLOR: Record<string, string> = { '3–5': C.saffron, '6–8': C.gold, '9–12': C.navy };
  const color = AGE_COLOR[Array.isArray(theme.ageRange) ? theme.ageRange[0] : theme.ageRange] || C.saffron;


  // Pick 6 other themes (same age group first, then others)
  const otherThemes = [
    ...THEMES.filter(t => t.slug !== theme.slug && t.ageRange === theme.ageRange),
    ...THEMES.filter(t => t.slug !== theme.slug && t.ageRange !== theme.ageRange),
  ].slice(0, 6);

  const handleOrder = () => {
    setShowOrder(true);
    setTimeout(() => document.getElementById('inline-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const setOf = (k: string, v: string) => setOrderForm(f => ({ ...f, [k]: v }));

  const handleOrderPhotoAdd = (file: File) => {
    const preview = URL.createObjectURL(file);
    setOrderPhoto({ preview, uploading: true, uploadedPath: null, signedUrl: null });
    const reader = new FileReader();
    reader.onload = () => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/upload-photo`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          setOrderPhoto(p => p ? { ...p, uploading: false, uploadedPath: data.photo_url || null, signedUrl: data.photo_signed_url || null } : null);
        } catch { setOrderPhoto(p => p ? { ...p, uploading: false } : null); }
      };
      xhr.onerror = () => setOrderPhoto(p => p ? { ...p, uploading: false } : null);
      xhr.send(JSON.stringify({ photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/validate-coupon`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponApplied({ code: couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, finalPrice: data.finalPrice, discountType: data.discountType, discountValue: data.discountValue });
        setCouponError('');
      } else {
        setCouponApplied(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch { setCouponError('Could not validate coupon. Try again.'); }
    setCouponLoading(false);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderConsent) return;
    if (!orderPhoto?.uploadedPath) {
      setOrderError("Please upload your child's photo before placing the order.");
      return;
    }
    setOrderSubmitting(true);
    setOrderError('');
    try {
      const res = await fetch(`${API_BASE}/api/order-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderForm,
          storyTheme: theme.slug,
          photoSignedUrl: orderPhoto?.signedUrl || null,
          photoPath: orderPhoto?.uploadedPath || null,
          couponCode: couponApplied?.code || null,
          referralSource: localStorage.getItem('protago_ref') || null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to create order'); }
      const { orderId, razorpayKeyId, amount, currency } = await res.json();

      // Dev/mock mode — no real Razorpay keys
      if (!razorpayKeyId || razorpayKeyId.includes('your_')) {
        setOrderSubmitted(true);
        setOrderSubmitting(false);
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Protago',
        description: `Personalised Storybook — ${theme.name}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            // Fire-and-forget confirmation email
            fetch(`${API_BASE}/api/order/send-confirmation-email`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpayOrderId: response.razorpay_order_id }),
            }).catch(() => {});
            navigate('/order-confirmed', { state: { childName: orderForm.childName, email: orderForm.email, amount: amount / 100 } });
          } catch {
            setOrderError('Payment verification failed. Please contact support.');
          } finally {
            setOrderSubmitting(false);
          }
        },
        prefill: { name: orderForm.parentName, email: orderForm.email, contact: orderForm.phone },
        theme: { color: '#FF6B35' },
        modal: {
          ondismiss: () => {
            setOrderSubmitting(false);
            setOrderError('Payment was cancelled. Please try again.');
          },
        },
      };
      new window.Razorpay(options).open();
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setOrderSubmitting(false);
    }
  };

  const handleThemeClick = (slug: string) => {
    navigate(`/theme/${slug}`);
    // scroll handled by the slug useEffect above
  };

  const handlePhotoAdd = (file: File) => {
    const preview = URL.createObjectURL(file);
    setPhoto({ preview, uploading: true, signedUrl: null });

    const img = new Image();
    img.onload = () => {
      // Resize to max 1500px on longest side, re-encode as JPEG q90
      const MAX = 1500;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.90);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/upload-photo`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.photo_signed_url) {
            setPhoto(p => p ? { ...p, uploading: false, signedUrl: data.photo_signed_url } : null);
          } else {
            setPhoto(p => p ? { ...p, uploading: false } : null);
            setJobStatus('Error: Upload failed. Please try a different photo.');
          }
        } catch { setPhoto(p => p ? { ...p, uploading: false } : null); }
      };
      xhr.onerror = () => {
        setPhoto(p => p ? { ...p, uploading: false } : null);
        setJobStatus('Error: Could not upload photo. Please check your connection and try again.');
      };
      xhr.send(JSON.stringify({ photo: base64 }));
      URL.revokeObjectURL(preview);
    };
    img.onerror = () => {
      setPhoto(null);
      setJobStatus('Error: Could not read this image. Please try a different file.');
    };
    img.src = preview;
  };

  const handleGenerate = () => {
    const firstName = childName.trim().split(/\s+/)[0];
    if (!firstName) { setNameError(true); return; }
    if (firstName !== childName) setChildName(firstName);
    if (!photo?.signedUrl) return;
    // Basic email format check before hitting backend
    const emailTrimmed = previewEmail.trim();
    if (!emailTrimmed) { setEmailError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) { setEmailError('Enter a valid email address'); return; }
    setNameError(false);
    setEmailError('');
    setGenerating(true);
    setJobStatus('');
    const newTab = window.open('/preview/loading', '_blank');
    (async () => {
      const res = await fetch(`${API_BASE}/api/preview/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storySlug: theme.slug, photoUrl: photo.signedUrl, childName: firstName, email: emailTrimmed, gender: gender ?? undefined, ageGroup: selectedAgeGroup ?? undefined, childAge: selectedAge ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        newTab?.close();
        setJobStatus(`Error: ${data.error}`);
        setGenerating(false);
        return;
      }
      const params = new URLSearchParams({ name: childName, theme: theme.slug });
      if (gender) params.set('gender', gender);
      if (selectedAgeGroup) params.set('ageGroup', selectedAgeGroup);
      if (selectedAge !== null) params.set('age', String(selectedAge));
      if (emailTrimmed) params.set('email', emailTrimmed);
      if (newTab) newTab.location.href = `/preview/${data.jobId}?${params}`;
      setGenerating(false);
      setJobStatus('opened');
    })();
  };

  const canGenerate = !!childName.trim() && !!photo?.signedUrl && consent && !generating && !!gender && !!selectedAgeGroup;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <NavBar />

      <div style={{ maxWidth: 920, margin: '0 auto', paddingTop: 130, paddingBottom: 0 }}>

        {/* ── Two-column card ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', background: C.white, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.07)', margin: '0 16px' }}>

          {/* LEFT: animation + info */}
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #F5F5F5' }}>

            {/* Scene animation — or actual preview images if coming from PreviewResultPage */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {locationState?.previewUrls?.some(u => u) ? (
                /* ── Actual generated preview images ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {locationState.previewUrls.filter(Boolean).map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '16/9', background: '#F0EEE8', overflow: 'hidden', borderBottom: i === 0 ? '2px solid #F0EEE8' : undefined }}>
                      <motion.img src={url!} alt={`Preview scene ${i + 1}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: i * 0.15 }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {i === 0 && (
                        <div style={{ position: 'absolute', top: 8, left: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#fff', backdropFilter: 'blur(4px)' }}>
                          ✨ Your preview
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px 12px', background: '#F0FDF4', borderTop: '1px solid #BBF7D0' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#166534', margin: 0 }}>✓ Preview generated — your child's face in every scene</p>
                  </div>
                </div>
              ) : (
                /* ── Default face-swap animation ── */
                <div style={{ aspectRatio: '4/3', background: '#F0EEE8', position: 'relative', overflow: 'hidden' }}>
                  {FACE_SAMPLES.map((sample, i) => (
                    <motion.img key={sample.key}
                      src={`/themes_mockup/${theme.slug}_${sample.key}_mockup.webp`}
                      alt="" decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.3)' }}
                      animate={{ opacity: i === activeIdx ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                  {true && (
                    <svg viewBox="0 0 160 90" preserveAspectRatio="none"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
                      <motion.path d="M 148 4 Q 148 40 80 28" fill="none" stroke={C.saffron}
                        strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ pathLength: { duration: 1.0, delay: 0.2 }, opacity: { duration: 0.2 } }}
                        key={activeIdx} />
                      <motion.path d="M 88 23 L 80 28 L 87 33" fill="none" stroke={C.saffron}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
                        key={`ah-${activeIdx}`} />
                    </svg>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '30px 16px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', zIndex: 4 }}>
                    <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', margin: 0 }}>
                      {theme.icon} {theme.name}
                    </p>
                  </div>
                </div>
              )}
              {!locationState?.previewUrls?.some(u => u) && (
                <div style={{ position: 'absolute', top: 12, right: 16, width: 72, height: 72, zIndex: 10 }}>
                  {FACE_SAMPLES.map((sample, i) => (
                    <motion.img key={sample.face} src={sample.face} alt="" decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                        borderRadius: '50%', border: `3px solid ${C.saffron}`, boxShadow: '0 4px 16px rgba(255,107,53,0.35), 0 0 0 3px #fff' }}
                      animate={{ opacity: i === activeIdx ? 1 : 0, scale: i === activeIdx ? 1 : 0.9 }}
                      transition={{ duration: 0.4 }} />
                  ))}
                </div>
              )}
            </div>

            {/* Price + promo strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#FFF7ED', borderTop: '1px solid #FFE4CC', borderBottom: '1px solid #FFE4CC' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#22C55E', borderRadius: 50, padding: '2px 8px' }}>15% OFF</span>
              <span style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600 }}>₹1,499</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: "'Baloo 2', sans-serif" }}>₹1,274</span>
              <span style={{ fontSize: 11, color: C.saffron, fontWeight: 700 }}>· Use code <strong>PROTAGO50</strong></span>
            </div>

            {/* Info */}
            <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', padding: '3px 10px', borderRadius: 20, border: `1px solid ${color}30` }}>
                  Ages {theme.ageRange}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: 20, border: '1px solid #E5E7EB' }}>
                  26 pages
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: C.gray, margin: 0 }}>{theme.description}</p>

              {/* Feature bullets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0' }}>
                {[
                  `Perfect for children aged ${theme.ageRange}`,
                  'Add your child\'s name & photo',
                  'Preview for free in ~2 minutes',
                  'Order a printed book anytime',
                ].map((label, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.saffron, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: C.gray }}>{label}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleOrder}
                style={{ width: '100%', background: 'none', border: `1.5px solid ${C.saffron}`, borderRadius: 10, padding: '11px 16px', fontWeight: 800, fontSize: 13, color: C.saffron, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", marginTop: 4 }}>
                Skip preview — Order this story →
              </button>
            </div>
          </div>

          {/* RIGHT: preview form */}
          <div style={{ flex: '1 1 300px', padding: '32px 28px 36px', display: 'flex', flexDirection: 'column', background: C.white }}>

            <AnimatePresence mode="wait">
              {jobStatus === 'opened' ? (
                <motion.div key="opened" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0', textAlign: 'center', flex: 1, justifyContent: 'center' }}>
                  <div style={{ fontSize: 56 }}>✨</div>
                  <p style={{ fontWeight: 800, color: C.navy, fontSize: 17, margin: 0, fontFamily: "'Baloo 2', sans-serif" }}>Preview is generating!</p>
                  <p style={{ fontSize: 13, color: C.lgray, margin: 0 }}>Check the new tab — ready in ~2 min.</p>
                  <button onClick={() => { setJobStatus(''); setPhoto(null); setChildName(''); setGenerating(false); setConsent(false); }}
                    style={{ marginTop: 8, background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 20px', fontSize: 13, color: C.gray, cursor: 'pointer', fontWeight: 700 }}>
                    Generate another →
                  </button>
                </motion.div>

              ) : generating ? (
                <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '50px 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    style={{ fontSize: 40, marginBottom: 14 }}>⚙️</motion.div>
                  <p style={{ fontSize: 14, color: C.lgray }}>Starting your preview…</p>
                </motion.div>

              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                  {/* Header */}
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.saffron, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 4px' }}>Free {previewPageCount}-Page Preview</p>
                  <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 21, color: C.navy, margin: '0 0 24px', lineHeight: 1.2 }}>
                    See your child<br />in this story
                  </h2>

                  {jobStatus.startsWith('Error') && (
                    <div style={{ padding: '10px 14px', background: '#FFF0F0', borderRadius: 8, marginBottom: 14, border: '1px solid #FFCDD2' }}>
                      <p style={{ fontSize: 12, color: '#C0392B', margin: 0 }}>{jobStatus}</p>
                    </div>
                  )}

                  {/* Step 1: Name */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
                      Child's name <span style={{ color: C.saffron }}>*</span>
                    </label>
                    <input
                      placeholder="e.g. Aryan"
                      value={childName}
                      onChange={e => { setChildName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                      onBlur={e => { const first = e.target.value.trim().split(/\s+/)[0]; setChildName(first); }}
                      style={{
                        border: `1.5px solid ${nameError ? '#E53E3E' : '#E5E7EB'}`,
                        borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none',
                        width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                        background: nameError ? '#FFF5F5' : '#fff',
                        transition: 'border-color 0.2s',
                      }} />
                    {nameError && <p style={{ fontSize: 11, color: '#E53E3E', margin: '4px 0 0' }}>Please enter your child's name</p>}
                  </div>

                  {/* Gender toggle */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 8 }}>
                      Child's gender <span style={{ color: C.saffron }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['boy', 'girl'] as const).map(g => (
                        <button key={g} type="button" onClick={() => setGender(g)}
                          style={{
                            flex: 1, padding: '11px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                            border: `1.5px solid ${gender === g ? C.saffron : '#E5E7EB'}`,
                            background: gender === g ? C.saffron + '18' : '#fff',
                            color: gender === g ? C.saffron : C.gray,
                            fontWeight: 800, fontSize: 15,
                            transition: 'all 0.15s',
                          }}>
                          {g === 'boy' ? '👦 Boy' : '👧 Girl'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age picker — individual ages 3–12 */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 8 }}>
                      Child's age <span style={{ color: C.saffron }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[3,4,5,6,7,8,9,10,11,12].map(age => {
                        const sel = selectedAge === age;
                        return (
                          <button key={age} type="button" onClick={() => pickAge(age)}
                            style={{
                              width: 40, height: 40, borderRadius: 10, cursor: 'pointer',
                              fontFamily: 'inherit', fontWeight: 800, fontSize: 14,
                              border: `1.5px solid ${sel ? C.saffron : '#E5E7EB'}`,
                              background: sel ? C.saffron : '#fff',
                              color: sel ? '#fff' : C.gray,
                              transition: 'all 0.15s',
                            }}>
                            {age}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
                      Your email <span style={{ color: C.saffron }}>*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={previewEmail}
                      onChange={e => { setPreviewEmail(e.target.value); if (emailError) setEmailError(''); }}
                      style={{
                        border: `1.5px solid ${emailError ? '#E53E3E' : '#E5E7EB'}`,
                        borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none',
                        width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                        background: emailError ? '#FFF5F5' : '#fff',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.target.style.borderColor = emailError ? '#E53E3E' : C.saffron)}
                      onBlur={e => (e.target.style.borderColor = emailError ? '#E53E3E' : '#E5E7EB')} />
                    {emailError
                      ? <p style={{ fontSize: 11, color: '#E53E3E', margin: '4px 0 0' }}>{emailError}</p>
                      : <p style={{ fontSize: 13, fontWeight: 700, color: '#E53E3E', margin: '6px 0 0' }}>⭐ We'll send your preview here so you can always access it</p>
                    }
                  </div>

                  {/* Step 2: Photo */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
                      Child's photo <span style={{ color: C.saffron }}>*</span>
                    </label>
                    {/* Photo tips */}
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
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
                    {!photo ? (
                      <label style={{
                        border: '2px dashed #E5E7EB', borderRadius: 12, padding: '22px 14px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        cursor: 'pointer', background: '#FAFAFA', transition: 'border-color 0.2s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = C.saffron)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                        <span style={{ fontSize: 34 }}>📸</span>
                        <span style={{ fontWeight: 700, color: C.navy, fontSize: 13 }}>Upload child's photo</span>
                        <span style={{ fontSize: 11, color: C.lgray }}>Clear, front-facing works best</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.saffron, textAlign: 'center' }}>📷 Higher quality photo = better results</span>
                        <span style={{ fontSize: 10, color: C.lgray, textAlign: 'center' }}>Any size accepted · Auto-compressed · JPG, PNG, HEIC</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoAdd(f); }} />
                      </label>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F0FDF4', borderRadius: 10, border: '1.5px solid #BBF7D0' }}>
                        <img src={photo.preview} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} alt="" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>{photo.uploading ? '⏳ Uploading…' : '✓ Photo ready'}</div>
                          {photo.uploading && <div style={{ fontSize: 11, color: '#166534', opacity: 0.7 }}>Please wait…</div>}
                        </div>
                        {!photo.uploading && (
                          <button onClick={() => setPhoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.lgray, fontSize: 20, lineHeight: 1, flexShrink: 0 }}>×</button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Consent */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                      style={{ marginTop: 2, flexShrink: 0, accentColor: C.saffron, width: 15, height: 15, cursor: 'pointer' }} />
                    <span style={{ fontSize: 12, lineHeight: 1.6, color: C.gray }}>
                      I confirm that I am at least 18 years old and have obtained consent from the child's parent or guardian to share this information for the purpose of creating a personalised storybook, in accordance with the{' '}
                      <a href="/privacy" style={{ color: C.saffron, textDecoration: 'underline' }}>Privacy Policy</a>.
                    </span>
                  </label>

                  {/* Generate button */}
                  <button disabled={!canGenerate} onClick={handleGenerate}
                    style={{
                      background: canGenerate ? `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)` : '#E5E7EB',
                      color: canGenerate ? '#fff' : '#9CA3AF',
                      border: 'none', borderRadius: 12, padding: '15px 18px',
                      fontWeight: 800, fontSize: 16, cursor: canGenerate ? 'pointer' : 'default',
                      fontFamily: "'Baloo 2', sans-serif", transition: 'all 0.2s',
                      boxShadow: canGenerate ? '0 4px 16px rgba(255,107,53,0.4)' : 'none',
                    }}>
                    ✨ Generate Free {previewPageCount}-Page Preview
                  </button>
                  <p style={{ fontSize: 11, color: C.lgray, textAlign: 'center', margin: '10px 0 0' }}>Free · ~2 min · No card required</p>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Inline order form ── */}
        {showOrder && (
          <div id="inline-order" style={{ margin: '32px 16px 0', background: C.white, borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', overflow: 'hidden', border: '1px solid #F0EEE8' }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`, padding: '28px 36px 24px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 1.8, margin: '0 0 6px' }}>Order your book</p>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 24, color: '#fff', margin: '0 0 4px' }}>
                {theme.icon} {theme.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', background: 'rgba(255,255,255,0.15)', borderRadius: 50, padding: '2px 8px', letterSpacing: 0.3 }}>15% OFF</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'line-through', fontWeight: 600 }}>₹1,499</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Baloo 2', sans-serif" }}>₹1,274</span>
              </div>
            </div>

            {orderSubmitted ? (
              <div style={{ padding: '60px 36px', textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.navy, fontSize: 22, margin: '0 0 8px' }}>Order received!</h3>
                <p style={{ fontSize: 14, color: C.gray, margin: 0, lineHeight: 1.7 }}>We'll reach out to <strong>{orderForm.email}</strong> within 24 hours to confirm your order.</p>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {orderError && (
                  <div style={{ padding: '12px 14px', background: '#FFF0F0', borderRadius: 8, border: '1px solid #FFCDD2' }}>
                    <p style={{ fontSize: 13, color: '#C0392B', margin: 0 }}>{orderError}</p>
                  </div>
                )}

                {/* Row 1: name + email + phone */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Your name *', key: 'parentName', placeholder: 'Priya Sharma', type: 'text' },
                    { label: 'Email *', key: 'email', placeholder: 'you@email.com', type: 'email' },
                    { label: 'WhatsApp *', key: 'phone', placeholder: '+91 98765 43210', type: 'tel' },
                  ].map(({ label, key, placeholder, type }) => (
                    <div key={key}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
                      <input required type={type} placeholder={placeholder} value={orderForm[key as keyof typeof orderForm]}
                        onChange={e => setOf(key, e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                        onFocus={e => (e.target.style.borderColor = C.saffron)}
                        onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                    </div>
                  ))}
                </div>

                {/* Row 2: child name + age + gender */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Child's name *</label>
                    <input required placeholder="Arjun" value={orderForm.childName} onChange={e => setOf('childName', e.target.value)}
                      style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                      onFocus={e => (e.target.style.borderColor = C.saffron)}
                      onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Age *</label>
                    <select required value={orderForm.childAge} onChange={e => setOf('childAge', e.target.value)}
                      style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}>
                      <option value="">Select age</option>
                      {Array.from({ length: 10 }, (_, i) => i + 3).map(a => <option key={a} value={a}>{a} years old</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Gender *</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Boy', 'Girl'].map(g => (
                        <button type="button" key={g} onClick={() => setOf('childGender', g)}
                          style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${orderForm.childGender === g ? C.saffron : '#E5E7EB'}`, background: orderForm.childGender === g ? '#FFF3EE' : '#fff', color: orderForm.childGender === g ? C.saffron : '#9CA3AF' }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 3: photo (with tips) + address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Child's photo *</label>
                    {/* Photo tips 2×2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {[
                        { img: '/photo-tips/good.avif',       label: 'Front-facing', good: true },
                        { img: '/photo-tips/group.jpg',       label: 'One person',   good: false },
                        { img: '/photo-tips/sunglasses.avif', label: 'No glasses',   good: false },
                        { img: '/photo-tips/sideangle.jpg',   label: 'No side angle',good: false },
                      ].map(({ img, label, good }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ position: 'relative' }}>
                            <img src={img} alt={label} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `2.5px solid ${good ? '#22C55E' : '#EF4444'}`, display: 'block' }} />
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 17, height: 17, borderRadius: '50%', background: good ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 800, border: '2px solid #fff' }}>
                              {good ? '✓' : '✕'}
                            </div>
                          </div>
                          <p style={{ fontSize: 9, color: C.gray, textAlign: 'center', lineHeight: 1.3, margin: 0 }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    {!orderPhoto ? (
                      <>
                        <label style={{ border: `2px dashed ${C.saffron}`, borderRadius: 10, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', background: '#FFF8F0', flex: 1, justifyContent: 'center' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FFF0E0')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#FFF8F0')}>
                          <span style={{ fontSize: 24 }}>📸</span>
                          <span style={{ fontWeight: 700, color: C.navy, fontSize: 12, textAlign: 'center' }}>Upload photo</span>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleOrderPhotoAdd(f); }} />
                        </label>
                        <p style={{ fontSize: 11, color: C.saffron, fontWeight: 700, margin: '2px 0 0', textAlign: 'center', lineHeight: 1.4 }}>
                          ⚠️ Required to place order
                        </p>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F0FDF4', borderRadius: 10, border: '1.5px solid #BBF7D0' }}>
                        <img src={orderPhoto.preview} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} alt="" />
                        <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#166534' }}>{orderPhoto.uploading ? '⏳ Uploading…' : '✓ Ready'}</div>
                        {!orderPhoto.uploading && <button type="button" onClick={() => setOrderPhoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Delivery address</label>
                    {[
                      { key: 'addressLine1', label: 'Address line 1 *', placeholder: 'Flat / House no., Building, Street', required: true },
                      { key: 'addressLine2', label: 'Address line 2 (optional)', placeholder: 'Area, Landmark', required: false },
                    ].map(({ key, label, placeholder, required }) => (
                      <div key={key}>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</label>
                        <input required={required} placeholder={placeholder}
                          value={orderForm[key as keyof typeof orderForm]} onChange={e => setOf(key, e.target.value)}
                          style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                          onFocus={e => (e.target.style.borderColor = C.saffron)}
                          onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {[
                        { key: 'city', label: 'City *', placeholder: 'e.g. Mumbai' },
                        { key: 'state', label: 'State *', placeholder: 'e.g. Maharashtra' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</label>
                          <input required placeholder={placeholder}
                            value={orderForm[key as keyof typeof orderForm]} onChange={e => setOf(key, e.target.value)}
                            style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                            onFocus={e => (e.target.style.borderColor = C.saffron)}
                            onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Pincode *</label>
                        <input required placeholder="e.g. 400001" inputMode="numeric" maxLength={6} pattern="[0-9]{6}"
                          value={orderForm.pincode} onChange={e => setOf('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                          style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                          onFocus={e => (e.target.style.borderColor = C.saffron)}
                          onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                      </div>
                      <div>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Country</label>
                        <input value="India" readOnly style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#F9FAFB', color: '#9CA3AF' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dedication message */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Personal message for the first page <span style={{ color: '#C4B5A0', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <textarea
                    placeholder={`e.g. "To my little star — may you always reach for the sky. With all my love, ${orderForm.parentName || 'Mama'}"`}
                    value={orderForm.dedicationMessage}
                    onChange={e => setOf('dedicationMessage', e.target.value)}
                    rows={2}
                    maxLength={200}
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', resize: 'none' }}
                    onFocus={e => (e.target.style.borderColor = '#FF6B35')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                  <p style={{ fontSize: 10, color: '#9CA3AF', margin: '4px 0 0' }}>
                    🎬 Printed on the first page — Starring <strong>{orderForm.childName || 'your child'}</strong> · Produced with love by <strong>{orderForm.parentName || 'you'}</strong>
                  </p>
                </div>

                {/* Coupon code */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Promo code (optional)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="e.g. WELCOME20"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponApplied(null); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                      style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
                      onFocus={e => (e.target.style.borderColor = C.saffron)}
                      onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                    <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                      style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: couponLoading || !couponInput.trim() ? 'default' : 'pointer', opacity: couponLoading || !couponInput.trim() ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                      {couponLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  {couponApplied && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FFF4', border: '1.5px solid #22C55E', borderRadius: 9, padding: '8px 12px' }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>✓ {couponApplied.code} applied! </span>
                        <span style={{ fontSize: 12, color: '#16A34A' }}>
                          {couponApplied.discountType === 'percent' ? `${couponApplied.discountValue}% off` : `₹${couponApplied.discountAmount} off`}
                        </span>
                      </div>
                      <button type="button" onClick={() => { setCouponApplied(null); setCouponInput(''); }}
                        style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                    </div>
                  )}
                  {couponError && <p style={{ fontSize: 12, color: '#EF4444', margin: '6px 0 0' }}>{couponError}</p>}
                </div>

                {/* Consent + submit */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" required checked={orderConsent} onChange={e => setOrderConsent(e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0, accentColor: C.saffron, width: 15, height: 15, cursor: 'pointer' }} />
                  <span style={{ fontSize: 11, lineHeight: 1.6, color: '#9CA3AF' }}>
                    I confirm I am 18+ and have obtained parental consent to share this information per the{' '}
                    <a href="/privacy" style={{ color: C.saffron, textDecoration: 'underline' }}>Privacy Policy</a>.
                  </span>
                </label>

                <button type="submit" disabled={orderSubmitting || !orderConsent || !orderPhoto?.uploadedPath}
                  style={{ background: (!orderConsent || orderSubmitting || !orderPhoto?.uploadedPath) ? '#E5E7EB' : `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`, color: (!orderConsent || orderSubmitting || !orderPhoto?.uploadedPath) ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 800, fontSize: 16, cursor: (!orderConsent || orderSubmitting || !orderPhoto?.uploadedPath) ? 'default' : 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: (!orderConsent || orderSubmitting || !orderPhoto?.uploadedPath) ? 'none' : '0 4px 16px rgba(255,107,53,0.4)' }}>
                  {orderSubmitting ? 'Processing…' : `Pay ₹${couponApplied ? couponApplied.finalPrice : (Number(import.meta.env.VITE_STORYBOOK_PRICE) || 499)} & Order →`}
                </button>
                <p style={{ fontSize: 11, color: C.lgray, textAlign: 'center', margin: '-4px 0 0' }}>We'll confirm within 24 hours · Delivered in 5–7 business days</p>

              </form>
            )}
          </div>
        )}

        {/* ── Explore more themes ── */}
        <div style={{ padding: '48px 16px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 18, color: C.navy, margin: 0 }}>
              Explore more themes
            </h3>
            <button onClick={() => navigate('/?scroll=themes')}
              style={{ background: 'none', border: `1.5px solid ${C.saffron}`, borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: C.saffron, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", whiteSpace: 'nowrap' }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {otherThemes.map(t => (
              <button key={t.slug} onClick={() => handleThemeClick(t.slug)}
                style={{ background: C.white, border: '1.5px solid #F0EEE8', borderRadius: 12, overflow: 'visible', cursor: 'pointer', textAlign: 'left', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s, transform 0.15s', position: 'relative' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}>

                {/* Face circle */}
                <div style={{ position: 'absolute', top: -16, right: 8, width: 36, height: 36, zIndex: 10, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${C.saffron}`, boxShadow: '0 2px 8px rgba(255,107,53,0.3), 0 0 0 1.5px #fff' }}>
                  {FACE_SAMPLES.map((s, i) => (
                    <motion.img key={s.key} src={s.face} alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      animate={{ opacity: i === activeIdx ? 1 : 0 }} transition={{ duration: 0.5 }} />
                  ))}
                </div>

                <div style={{ borderRadius: '12px 12px 0 0', aspectRatio: '4/3', background: '#F0EEE8', overflow: 'hidden', position: 'relative' }}>
                  {FACE_SAMPLES.map((s, i) => (
                    <motion.img key={s.key}
                      src={`/themes_mockup/${t.slug}_${s.key}_mockup.webp`} alt=""
                      loading="lazy" decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block', transform: 'scale(1.3)' }}
                      animate={{ opacity: i === activeIdx ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ))}
                  {/* Arrow from face to scene */}
                  <svg viewBox="0 0 160 90" preserveAspectRatio="none"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
                    <motion.path d="M 148 4 Q 148 40 80 28" fill="none" stroke={C.saffron}
                      strokeWidth="1.8" strokeLinecap="round" strokeDasharray="5 3"
                      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 }} key={`arrow-${activeIdx}`} />
                    <motion.path d="M 88 23 L 80 28 L 87 33" fill="none" stroke={C.saffron}
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 }} key={`arrowhead-${activeIdx}`} />
                  </svg>
                </div>

                <div style={{ padding: '10px 12px 11px' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: 0, lineHeight: 1.3 }}>{t.icon} {t.name}</p>
                  <p style={{ fontSize: 11, color: C.lgray, margin: '3px 0 0' }}>Ages {t.ageRange}</p>
                </div>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button onClick={() => navigate('/?scroll=themes')}
              style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 24, padding: '12px 32px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
              Browse all {THEMES.length} themes →
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ background: C.navy, padding: '40px 20px 24px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 32 }}>
            <div>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.saffron }}>protago</span>
              <p style={{ fontSize: 13, marginTop: 10, lineHeight: 1.6, color: 'rgba(255,255,255,0.45)' }}>
                Magical, personalised storybooks that make every Indian child the hero of their own adventure.
              </p>
              <a href="mailto:hello@protago.in" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.gold, marginTop: 10, textDecoration: 'none' }}>
                <MessageCircle size={14} /> hello@protago.in
              </a>
              <a href="https://wa.me/919452868857" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.gold, marginTop: 8, textDecoration: 'none' }}>
                <MessageCircle size={14} /> WhatsApp: +91 94528 68857
              </a>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>Legal</h4>
              {[['Privacy Policy', '/privacy'], ['Terms & Conditions', '/terms'], ['Refund Policy', '/refund']].map(([label, href]) => (
                <div key={href} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>{label}</a>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>&copy; {new Date().getFullYear()} Protago. All rights reserved.</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Made with love in India 🇮🇳</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
