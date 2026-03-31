import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import { NavBar } from '../components/NavBar';
import { THEMES, ageToRange } from '../data/themes';

// ── Palette — two backgrounds (white / navy), one warm gradient, saffron + gold accents
const C = {
  saffron:  '#FF6B35',
  gold:     '#F7B731',
  navy:     '#1A1A2E',
  navyCard: '#252540',   // slightly lighter card bg inside navy sections
  white:    '#FFFFFF',
  warmTint: '#FFF8F3',   // very subtle warm tint for alternating white sections
  gray:     '#555555',
  lgray:    '#999999',
  gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7B731 100%)',
};

// Section rhythm:  gradient → white → navy → white → warmTint → white → navy → gradient → white → navy footer

const faqs = [
  { q: 'How does the personalisation work?',
    a: "You share your child's name, age, and a photo. Our AI recreates their likeness across every page, making them the true hero of the adventure." },
  { q: 'How long does delivery take?',
    a: 'We deliver within 5–7 business days across India on premium 200GSM glossy paper, carefully packaged.' },
  { q: 'What age group are these books for?',
    a: 'We have stories for children aged 3–12, with language calibrated precisely to their age.' },
  { q: 'Can I see a sample before buying?',
    a: 'Yes! We provide sample previews so you can see illustration quality and storytelling style before ordering.' },
  { q: "What if I'm not satisfied?",
    a: "Reach out within 7 days and we'll make it right or offer a full refund." },
];

const artStyles = [
  { label: 'Pixar 3D',          img: '/styles/shreyansh_pixar.png',        caption: 'Warm, expressive · cinematic depth' },
  { label: 'DreamWorks',        img: '/styles/shreyansh_dreamworks.png',   caption: 'Bold, dynamic · full of personality' },
  { label: 'Comic Book',        img: '/styles/shreyansh_comic.png',        caption: 'Punchy panels · graphic novel energy' },
  { label: 'Flat Illustration', img: '/styles/shreyansh_illustration.png', caption: 'Clean, colourful · great for young readers' },
];

const boyStyles = [
  { label: 'Pixar 3D',          img: '/styles/boy_pixar.png' },
  { label: 'DreamWorks',        img: '/styles/boy_dreamworks.png' },
  { label: 'Comic Book',        img: '/styles/boy_comic.png' },
  { label: 'Flat Illustration', img: '/styles/boy_illustration.png' },
];

const girlStyles = [
  { label: 'Pixar 3D',          img: '/styles/girl_pixar.png' },
  { label: 'DreamWorks',        img: '/styles/girl_dreamworks.png' },
  { label: 'Comic Book',        img: '/styles/girl_comic.png' },
  { label: 'Flat Illustration', img: '/styles/girl_illustration.png' },
];

const ageTiers = [
  { emoji: '🌱', range: 'Ages 3–5',  tone: 'Warm · Simple · Reassuring',  words: '6',  scenes: '8',
    desc: 'Short rhythmic sentences, gentle repetition, a safe and warm resolution.',
    borderColor: C.saffron },
  { emoji: '🚀', range: 'Ages 6–8',  tone: 'Energetic · Punchy · Action',  words: '10', scenes: '12',
    desc: 'Punchy sentences with real tension. Ready for the thrill of a proper adventure.',
    borderColor: C.gold },
  { emoji: '📖', range: 'Ages 9–12', tone: 'Rich · Emotional · Witty',     words: '15', scenes: '16',
    desc: 'Richer vocabulary, emotional depth, genuine humour. Stories older kids want to read.',
    borderColor: C.saffron },
];

const qualityItems = [
  { emoji: '🎯', title: 'Right for their age',  desc: 'Every sentence is measured for length and vocabulary. Too hard or too easy — it gets rewritten.' },
  { emoji: '💡', title: 'One clear lesson',      desc: 'Every story teaches exactly one thing, clearly and beautifully. No mixed messages.' },
  { emoji: '🎨', title: 'Every scene is vivid',  desc: 'Each scene is verified to be fully illustratable. No vague feelings — what you read gets painted.' },
];

const whyItems = [
  { emoji: '🌟', title: 'Builds real confidence',    desc: "Seeing themselves solve problems and be brave gives children a self-image that lasts far beyond bedtime." },
  { emoji: '🇮🇳', title: 'Culture they recognise',  desc: 'Indian names, mango trees, marigolds, mohalla streets. A world that looks like theirs.' },
  { emoji: '📚', title: 'Supports reading growth',   desc: 'Age-calibrated language challenges them just enough, building vocabulary without frustration.' },
  { emoji: '📖', title: 'A keepsake they return to', desc: 'Their name on every page. Children ask to read this one again and again.' },
];

// ── Shared typography helpers
const eyebrow = (text: string, onDark = false) => (
  <p className="text-xs font-bold uppercase tracking-widest mb-3"
    style={{ color: onDark ? C.gold : C.saffron, letterSpacing: '0.15em' }}>
    {text}
  </p>
);

const heading = (text: React.ReactNode, onDark = false) => (
  <h2 style={{
    fontFamily: "'Baloo 2', sans-serif", fontWeight: 800,
    color: onDark ? C.white : C.navy,
    fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)', lineHeight: 1.05,
  }}>
    {text}
  </h2>
);

const HERO_SLIDES = [
  { src: '/styles/cover_scene.png',      caption: 'Aarav · Courage' },
  { src: '/styles/scene_03.png',         caption: 'Something catches their ear…' },
  { src: '/styles/scene_07.png',         caption: 'A moment of triumph!' },
  { src: '/styles/scene_10.png',         caption: 'Everyone celebrates together.' },
  { src: '/styles/bhanvi_cover.png',     caption: 'Naina & Meera · Sky High' },
  { src: '/styles/bhanvi_scene_05.png',  caption: 'Look! Paris! cried Meera.' },
  { src: '/styles/bhanvi_scene_10.png',  caption: 'You can be a pilot one day too!' },
  { src: '/styles/prisha_cover.png',     caption: 'Diya · The Magic of Learning' },
  { src: '/styles/prisha_scene_09.png',  caption: 'She searched all night — and found it.' },
];

// ── ORDER FORM ─────────────────────────────────────────────────────────────

const VALUES = ['Courage & Bravery', 'Kindness & Friendship', 'Curiosity & Learning', 'Honesty & Trust', 'Teamwork', 'Environmental Care'];
const STYLES = [
  { label: 'Pixar 3D',          img: '/styles/boy_pixar.png',         available: true  },
  { label: 'DreamWorks',        img: '/styles/boy_dreamworks.png',    available: false },
  { label: 'Comic Book',        img: '/styles/boy_comic.png',         available: false },
  { label: 'Flat Illustration', img: '/styles/boy_illustration.png',  available: false },
];
const FORMATS = [
  { label: 'Immersive (Cinematic)', available: true },
  { label: 'Comic Book (Panels)',   available: false },
];

function OrderForm({ price }: { price: number; scrollTo: (id: string) => void }) {
  const [searchParams] = useSearchParams();
  const preselectedTheme = searchParams.get('theme') || '';

  const [form, setForm] = useState({
    parentName: '', email: '', phone: '',
    childName: '', childAge: '', childGender: '',
    theme: '', storyTheme: preselectedTheme, artStyle: '', storyFormat: '',
    deliveryType: 'print', address: '',
    notes: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number; finalPrice: number; discountType: string; discountValue: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponApplied({ code: couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, finalPrice: data.finalPrice, discountType: data.discountType, discountValue: data.discountValue });
        setCouponError('');
      } else {
        setCouponApplied(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Could not validate coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Upload photo immediately on selection with XHR progress tracking
  const handlePhotoSelect = async (file: File) => {
    setPhoto(file);
    setUploadedPhotoPath(null);
    setUploadProgress(0);
    setPhotoUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const body = JSON.stringify({ photo: base64 });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/api/upload-photo`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              setUploadedPhotoPath(data.photoPath || null);
              setUploadProgress(100);
            } catch { /* non-fatal */ }
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload error'));
        xhr.send(body);
      });
    } catch { /* non-fatal — order can still proceed */ } finally {
      setPhotoUploading(false);
    }
  };

  const proceedWithPayment = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setSubmitError('');
    try {
      // Use already-uploaded path; if still uploading wait briefly
      const photoPath = uploadedPhotoPath;

      const res = await fetch(`${API_BASE}/api/order-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photoPath,
          couponCode: couponApplied?.code || null,
          referralSource: localStorage.getItem('protago_ref') || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create order');
      }
      const { orderId, razorpayKeyId, amount, currency } = await res.json();

      // Dev/mock mode — no real Razorpay keys
      if (!razorpayKeyId || razorpayKeyId.includes('your_')) {
        setSubmitted(true);
        setSubmitting(false);
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Protago',
        description: `Personalised Storybook for ${form.childName}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            setSubmitted(true);
          } catch {
            setSubmitError('Payment verification failed. Please contact support.');
          } finally {
            setSubmitting(false);
          }
        },
        prefill: { name: form.parentName, email: form.email, contact: form.phone },
        theme: { color: '#FF6B35' },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setSubmitError('Payment was cancelled. Please try again.');
          },
        },
      };
      new window.Razorpay(options).open();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setShowConfirm(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid #E5E7EB`,
    fontSize: 14, color: C.navy, outline: 'none', background: C.white,
    fontFamily: "'Nunito', sans-serif",
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: C.gray,
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <section id="order" style={{ background: C.warmTint }} className="py-16 sm:py-20">
      <div className="max-w-2xl mx-auto px-5 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
          {eyebrow('Place your order')}
          {heading(<>Create your child's<br />personalised storybook.</>)}
          <p className="text-sm mt-3 leading-relaxed" style={{ color: C.gray }}>
            Fill in the details below and we'll bring your child's story to life. Starting at ₹{price}.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-10 text-center" style={{ background: C.white, border: `2px solid ${C.gold}` }}>
            <p className="text-4xl mb-4">🎉</p>
            <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.navy, fontSize: '1.5rem' }}>
              Order received!
            </h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: C.gray }}>
              Thank you! We'll reach out to <strong>{form.email}</strong> within 24 hours to confirm your order and next steps.
            </p>
          </motion.div>
        ) : (
          <motion.form initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="rounded-3xl p-6 sm:p-8 flex flex-col gap-6"
            style={{ background: C.white, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

            {/* ── Parent details */}
            <div>
              <p className="text-sm font-extrabold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
                Your details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Your name *</label>
                  <input required style={inputStyle} placeholder="e.g. Priya Sharma"
                    value={form.parentName} onChange={e => set('parentName', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input required type="email" style={inputStyle} placeholder="you@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label style={labelStyle}>WhatsApp / Phone *</label>
                  <input required style={inputStyle} placeholder="+91 98765 43210"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#F0F0F0' }} />

            {/* ── Child details */}
            <div>
              <p className="text-sm font-extrabold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
                About your child
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Child's name *</label>
                  <input required style={inputStyle} placeholder="e.g. Arjun"
                    value={form.childName} onChange={e => set('childName', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Age *</label>
                  <select required style={inputStyle} value={form.childAge} onChange={e => set('childAge', e.target.value)}>
                    <option value="">Select age</option>
                    {Array.from({ length: 10 }, (_, i) => i + 3).map(a => (
                      <option key={a} value={a}>{a} years old</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Gender *</label>
                  <div className="flex gap-2">
                    {['Boy', 'Girl', 'Other'].map(g => (
                      <button type="button" key={g}
                        onClick={() => set('childGender', g)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: form.childGender === g ? C.saffron : '#F5F5F5',
                          color: form.childGender === g ? C.white : C.gray,
                          border: `1.5px solid ${form.childGender === g ? C.saffron : 'transparent'}`,
                        }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Child's photo *</label>
                  <label className="flex flex-col items-center justify-center gap-1 rounded-xl cursor-pointer transition-colors"
                    style={{
                      border: `1.5px dashed ${photo ? C.saffron : '#D1D5DB'}`,
                      padding: '12px',
                      background: photo ? '#FFF8F3' : '#FAFAFA',
                    }}>
                    <span className="text-xl">{photoUploading ? '⏳' : photo ? '✅' : '📸'}</span>
                    <span className="text-xs font-semibold" style={{ color: photo ? C.saffron : C.lgray }}>
                      {photoUploading ? `Uploading… ${uploadProgress}%` : photo ? photo.name : 'Upload photo'}
                    </span>
                    {photoUploading && (
                      <div style={{ width: '100%', height: '4px', background: '#EEE', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, background: C.saffron, borderRadius: '2px', transition: 'width 0.2s ease' }} />
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }} />
                  </label>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#F0F0F0' }} />

            {/* ── Story customisation */}
            <div>
              <p className="text-sm font-extrabold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
                Customise the story
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label style={labelStyle}>Value (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {VALUES.map(t => (
                      <button type="button" key={t} onClick={() => set('theme', form.theme === t ? '' : t)}
                        className="py-2 px-3 rounded-xl text-xs font-bold transition-all leading-snug"
                        style={{
                          background: form.theme === t ? C.navy : '#F5F5F5',
                          color: form.theme === t ? C.white : C.gray,
                          border: `1.5px solid ${form.theme === t ? C.navy : 'transparent'}`,
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Theme *</label>
                  {(['3–5', '5–8', '8–12'] as const).map(range => {
                    const rangeThemes = THEMES.filter(t => t.ageRange === range);
                    const isRelevant = form.childAge ? ageToRange(Number(form.childAge)) === range : true;
                    return (
                      <div key={range} className="mb-3">
                        <p className="text-xs font-bold mb-2" style={{ color: isRelevant ? C.saffron : C.lgray }}>
                          Ages {range} {isRelevant && form.childAge ? '✓ recommended' : ''}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {rangeThemes.map(t => {
                            const selected = form.storyTheme === t.slug;
                            return (
                              <button type="button" key={t.slug}
                                onClick={() => set('storyTheme', t.slug)}
                                className="rounded-xl overflow-hidden text-left transition-all"
                                style={{
                                  border: `2.5px solid ${selected ? C.saffron : '#E5E7EB'}`,
                                  opacity: isRelevant ? 1 : 0.5,
                                  outline: 'none',
                                }}>
                                <div style={{ aspectRatio: '16/9', background: '#F0EEE8', position: 'relative' }}>
                                  <img src={`/themes/${t.slug}.png`} alt={t.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                  {selected && (
                                    <div style={{ position: 'absolute', top: 4, right: 4, background: C.saffron, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>
                                    </div>
                                  )}
                                </div>
                                <div style={{ padding: '4px 6px 5px', background: selected ? C.saffron : C.navy }}>
                                  <p style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{t.icon} {t.name}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <label style={labelStyle}>Art style *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {STYLES.map(s => (
                      <button type="button" key={s.label}
                        onClick={() => s.available && set('artStyle', s.label)}
                        className="rounded-xl overflow-hidden transition-all text-left relative"
                        style={{
                          border: `2px solid ${form.artStyle === s.label ? C.saffron : s.available ? '#E5E7EB' : '#F0F0F0'}`,
                          opacity: s.available ? 1 : 0.6,
                          cursor: s.available ? 'pointer' : 'default',
                        }}>
                        {/* Style preview image */}
                        <div className="overflow-hidden" style={{ aspectRatio: '1/1', background: '#F5F5F5' }}>
                          <img src={s.img} alt={s.label} className="w-full h-full object-cover object-top" />
                        </div>
                        {/* Label row */}
                        <div className="flex items-center justify-between px-2.5 py-2"
                          style={{ background: form.artStyle === s.label ? C.saffron : s.available ? C.navy : '#CCCCCC' }}>
                          <span className="text-xs font-bold text-white">{s.label}</span>
                          {!s.available && (
                            <span className="text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5"
                              style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>
                              Soon
                            </span>
                          )}
                          {form.artStyle === s.label && (
                            <span className="text-xs text-white">✓</span>
                          )}
                        </div>
                        {/* Coming soon overlay */}
                        {!s.available && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.45)' }}>
                            <span className="text-xs font-extrabold px-3 py-1 rounded-full"
                              style={{ background: C.navy, color: C.white }}>
                              Coming Soon
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Story format *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map(({ label, available }) => (
                      <button type="button" key={label}
                        onClick={() => available && set('storyFormat', label)}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all relative"
                        style={{
                          background: form.storyFormat === label ? C.gold : '#F5F5F5',
                          color: form.storyFormat === label ? C.navy : available ? C.gray : '#BBBBBB',
                          border: `1.5px solid ${form.storyFormat === label ? C.gold : 'transparent'}`,
                          cursor: available ? 'pointer' : 'default',
                          opacity: available ? 1 : 0.7,
                        }}>
                        {label}
                        {!available && (
                          <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: C.saffron, color: '#fff' }}>Soon</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#F0F0F0' }} />

            {/* ── Delivery */}
            <div>
              <p className="text-sm font-extrabold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
                Delivery
              </p>
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => set('deliveryType', 'print')}
                  className="flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all text-left"
                  style={{
                    background: '#FFF8F3',
                    border: `2px solid ${C.saffron}`,
                    color: C.navy,
                  }}>
                  <span className="block mb-0.5">📦 Hardcover print</span>
                  <span className="font-semibold" style={{ color: C.saffron }}>₹{price} · 5–7 days</span>
                </button>
              </div>
              {form.deliveryType === 'print' && (
                <div>
                  <label style={labelStyle}>Delivery address *</label>
                  <textarea rows={3} required={form.deliveryType === 'print'} style={{ ...inputStyle, resize: 'none' }}
                    placeholder="Flat / House no, Street, City, State, PIN"
                    value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
              )}
            </div>

            {/* ── Notes */}
            <div>
              <label style={labelStyle}>Any special requests? (optional)</label>
              <p className="text-xs mb-1.5" style={{ color: C.saffron, fontWeight: 600 }}>The more information you give, the better the story will be!</p>
              <textarea rows={2} style={{ ...inputStyle, resize: 'none' }}
                placeholder="e.g. My child loves dinosaurs, include them in the story!"
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            {/* ── Coupon code */}
            <div style={{ height: 1, background: '#F0F0F0' }} />
            <div>
              <label style={labelStyle}>Coupon code (optional)</label>
              <div className="flex gap-2">
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="e.g. SHREYANKA20"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponApplied(null); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                />
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                  className="px-4 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
                  style={{ background: C.navy, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
              {couponApplied && (
                <div className="mt-2 flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ background: '#F0FFF4', border: '1.5px solid #22C55E' }}>
                  <div>
                    <span className="text-xs font-bold" style={{ color: '#16A34A' }}>✓ {couponApplied.code} applied!</span>
                    <span className="text-xs ml-2" style={{ color: '#16A34A' }}>
                      {couponApplied.discountType === 'percent' ? `${couponApplied.discountValue}% off` : `₹${couponApplied.discountAmount} off`}
                    </span>
                  </div>
                  <button type="button" onClick={() => { setCouponApplied(null); setCouponInput(''); }}
                    className="text-xs font-semibold" style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>{couponError}</p>}
            </div>

            {/* ── Submit */}
            {submitError && (
              <p className="text-sm text-red-500 text-center">{submitError}</p>
            )}
            {couponApplied && (
              <div className="flex items-center justify-between text-sm px-1">
                <span style={{ color: C.lgray }}>Original price</span>
                <span style={{ color: C.lgray, textDecoration: 'line-through' }}>₹{price}</span>
              </div>
            )}
            <button type="submit" disabled={submitting || photoUploading}
              className="w-full py-4 rounded-2xl text-base font-extrabold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: C.gradient, fontFamily: "'Baloo 2', sans-serif" }}>
              {submitting ? 'Processing…' : photoUploading ? `Uploading photo… ${uploadProgress}%` : <>Pay ₹{couponApplied ? couponApplied.finalPrice : price} & Order <ArrowRight size={16} /></>}
            </button>
            <p className="text-center text-xs" style={{ color: C.lgray }}>
              We'll confirm your order via WhatsApp/email within 24 hours.
            </p>
          </motion.form>
        )}
      </div>

      {/* ── Phone confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl p-8 w-full max-w-sm text-center"
              style={{ background: C.white }}>
              <p className="text-3xl mb-3">📱</p>
              <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.navy, fontSize: '1.2rem' }}>
                Confirm your number
              </h3>
              <p className="text-sm mt-2 mb-2" style={{ color: C.gray }}>
                We'll send order updates to:
              </p>
              <p className="text-xl font-bold mb-6" style={{ color: C.navy }}>{form.phone}</p>
              <button onClick={proceedWithPayment}
                className="w-full py-3 rounded-xl font-extrabold text-white mb-3"
                style={{ background: C.gradient, fontFamily: "'Baloo 2', sans-serif" }}>
                Yes, proceed to payment
              </button>
              <button onClick={() => setShowConfirm(false)}
                className="text-sm font-semibold" style={{ color: C.gray }}>
                Edit number
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export function BrochurePage() {
  const [openFaq, setOpenFaq]       = useState<number | null>(null);
  const [themesTab, setThemesTab]   = useState<'3–5' | '5–8' | '8–12'>('3–5');
  const [heroSlide, setHeroSlide]   = useState(0);
  const price = Number(import.meta.env.VITE_STORYBOOK_PRICE) || 499;
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const t = setInterval(() => setHeroSlide(i => (i + 1) % HERO_SLIDES.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll when arriving from another page via ?scroll= or ?theme=
  useEffect(() => {
    const anchor = searchParams.get('scroll') || (searchParams.get('theme') ? 'order' : null);
    if (anchor) {
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [searchParams]);

  // Capture influencer referral from ?ref= and persist in localStorage
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('protago_ref', ref);
  }, [searchParams]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* ── HEADER ─────────────────────────────── */}
      <NavBar />

      {/* ══════════════════════════════════════════
          § 1  HERO  — warm gradient
      ══════════════════════════════════════════ */}
      <section id="hero" style={{ background: C.gradient }} className="pt-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-start gap-0">

          {/* Text — left column */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex-none w-full sm:w-[44%] pt-10 sm:pt-16 pb-8 sm:pb-16 pr-0 sm:pr-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 text-xs font-bold uppercase tracking-widest w-fit"
              style={{ background: 'rgba(0,0,0,0.15)', color: 'rgba(255,255,255,0.9)' }}>
              Ages 3–12
            </div>
            <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: '#3D1A00', lineHeight: 1.05, fontSize: 'clamp(1.9rem,3.5vw,3rem)' }}
              className="mb-4">
              Every child is the{' '}
              <span style={{ color: C.white }}>protagonist</span>{' '}
              of their story.
            </h1>
            <p className="text-base font-semibold mb-2 leading-relaxed" style={{ color: '#5C2E00' }}>
              Personalised storybooks written and illustrated by AI — with your child's name, face, and world on every page.
            </p>
            <p className="text-sm italic font-semibold mb-8" style={{ color: '#7B3F00' }}>
              Because every child deserves to be the protagonist.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => scrollTo('order')}
                className="px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: C.navy, color: C.white }}>
                Order Your Book <ArrowRight size={14} />
              </button>
              <button onClick={() => scrollTo('art-styles')}
                className="px-6 py-3 rounded-full font-bold text-sm transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.28)', color: '#3D1A00' }}>
                See Art Styles
              </button>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <span style={{ color: C.navy, fontSize: 13 }}>★★★★★</span>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Loved by 500+ families · from ₹{price}
              </span>
            </div>
          </motion.div>

          {/* Carousel — right column, fixed square aspect ratio, scenes anchored left */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex-1 relative sm:rounded-tl-3xl overflow-hidden"
            style={{ aspectRatio: '1 / 1' }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={heroSlide}
                src={HERO_SLIDES[heroSlide].src}
                alt={HERO_SLIDES[heroSlide].caption}
                className="absolute inset-0 w-full h-full object-cover object-left"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
              />
            </AnimatePresence>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-20"
              style={{ background: 'linear-gradient(to top, #F7B731, transparent)' }} />

            {/* Caption */}
            <div className="absolute bottom-9 left-0 right-0 flex justify-center px-4">
              <AnimatePresence mode="wait">
                <motion.span key={heroSlide}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.25 }}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
                  {HERO_SLIDES[heroSlide].caption}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
              {HERO_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setHeroSlide(i)}
                  className="rounded-full transition-all duration-300"
                  style={{ width: i === heroSlide ? 18 : 6, height: 6, background: i === heroSlide ? C.white : 'rgba(255,255,255,0.4)' }}
                />
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 2  ONE PHOTO — white
      ══════════════════════════════════════════ */}
      <section style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Your child, the hero')}
            {heading('One photo. Every scene, their face.')}
            <p className="text-sm mt-3 leading-relaxed max-w-lg" style={{ color: C.gray }}>
              Our AI preserves their likeness in your chosen art style — keeping everything that makes them recognisably them.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {artStyles.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl overflow-hidden shadow-md border" style={{ borderColor: '#F0F0F0' }}>
                <div className="overflow-hidden bg-gray-50">
                  <img src={s.img} alt={s.label} className="w-full h-auto block object-top" />
                </div>
                <div className="py-2.5 text-center text-xs font-bold" style={{ background: C.navyCard, color: C.gold }}>
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Photo tips */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="rounded-2xl p-5 flex gap-4 items-start"
            style={{ background: C.warmTint, borderLeft: `4px solid ${C.saffron}` }}>
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: C.navy }}>For best results, your photo should be:</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                {['Clear face, looking at camera','Plain or simple background','Well lit, no harsh shadows','Any recent photo works'].map(t => (
                  <p key={t} className="text-xs font-semibold" style={{ color: C.gray }}>✓ {t}</p>
                ))}
              </div>
            </div>
          </motion.div>
          <p className="text-center text-xs mt-4" style={{ color: C.lgray }}>
            Your photo is never stored or shared. Used only to generate your book.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § THEMES — white
      ══════════════════════════════════════════ */}
      <section id="themes" style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            {eyebrow('What will their story be about?')}
            {heading(<>15 themes across<br />every age group</>)}
            <p className="text-sm mt-3 leading-relaxed" style={{ color: C.gray }}>
              From bedtime routines for toddlers to financial literacy for tweens — every theme is built around real learning moments. Click any to explore.
            </p>
          </motion.div>

          {/* Age tabs */}
          {(() => {
            const AGE_TABS = [
              { range: '3–5'  as const, label: 'Pre-school',    color: '#FF6B35' },
              { range: '5–8'  as const, label: 'Early School',  color: '#F7B731' },
              { range: '8–12' as const, label: 'Upper Primary', color: '#1A1A2E' },
            ];
            const tabThemes = THEMES.filter(t => t.ageRange === themesTab);
            const activeColor = AGE_TABS.find(t => t.range === themesTab)!.color;
            return (
              <>
                <div className="flex gap-2 mb-6">
                  {AGE_TABS.map(g => (
                    <button key={g.range} onClick={() => setThemesTab(g.range)}
                      className="flex-1 py-2.5 rounded-2xl font-extrabold transition-all text-center"
                      style={{
                        background: themesTab === g.range ? g.color : C.white,
                        color: themesTab === g.range ? '#fff' : C.lgray,
                        border: `2px solid ${themesTab === g.range ? g.color : '#E5E7EB'}`,
                        fontFamily: "'Baloo 2', sans-serif",
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}>
                      {g.range}
                      <span className="block opacity-80" style={{ fontSize: 10, fontWeight: 600 }}>{g.label}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={themesTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                    {tabThemes.map(t => (
                      <motion.a key={t.slug} href="/themes"
                        onClick={e => { e.preventDefault(); window.location.href = '/themes'; }}
                        className="rounded-2xl overflow-hidden cursor-pointer block"
                        style={{ border: '1.5px solid #E5E7EB', background: C.white, textDecoration: 'none' }}
                        whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
                        <div style={{ aspectRatio: '16/9', background: '#F0EEE8', position: 'relative' }}>
                          <img src={`/themes/${t.slug}.png`} alt={t.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 14px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}>
                            <p className="font-extrabold text-sm" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#fff' }}>{t.icon} {t.name}</p>
                          </div>
                        </div>
                      </motion.a>
                    ))}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 text-center">
                  <a href="/themes"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
                    style={{ background: activeColor, color: '#fff', textDecoration: 'none' }}>
                    Explore all themes & personalisation →
                  </a>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 3  ART STYLES — navy
      ══════════════════════════════════════════ */}
      <section id="art-styles" style={{ background: C.navy }} className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Step 1 · Choose your art style', true)}
            {heading('Four worlds. One hero. Your child.', true)}
          </motion.div>

          {/* Boy row */}
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Arjun, Age 7</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">

            {/* Real photo */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-hidden" style={{ background: C.navyCard }}>
                <img src="/styles/boy_base.png" alt="Real photo" className="w-full h-auto block object-top" />
              </div>
              <div className="py-2 text-center text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ background: C.saffron, color: C.white }}>
                <span>📸</span> Real Photo
              </div>
            </motion.div>

            {boyStyles.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-hidden" style={{ background: C.navyCard }}>
                  <img src={s.img} alt={s.label} className="w-full h-auto block object-top" />
                </div>
                <div className="py-2 text-center text-xs font-bold" style={{ background: C.navyCard, color: C.gold }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Girl row */}
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Priya, Age 7</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">

            {/* Real photo */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-hidden" style={{ background: C.navyCard }}>
                <img src="/styles/girl_base.png" alt="Real photo" className="w-full h-auto block object-top" />
              </div>
              <div className="py-2 text-center text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ background: C.saffron, color: C.white }}>
                <span>📸</span> Real Photo
              </div>
            </motion.div>

            {girlStyles.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-hidden" style={{ background: C.navyCard }}>
                  <img src={s.img} alt={s.label} className="w-full h-auto block object-top" />
                </div>
                <div className="py-2 text-center text-xs font-bold" style={{ background: C.navyCard, color: C.gold }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 4  STORY FORMATS — white
           Scenes shown full-size, no cropping
      ══════════════════════════════════════════ */}
      <section id="books" style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-10">
            {eyebrow('Step 2 · Choose your story format')}
            {heading('Two ways to tell your child\'s story.')}
          </motion.div>

          <div className="flex flex-col gap-8">

            {/* Immersive */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="rounded-3xl overflow-hidden shadow-xl border" style={{ borderColor: '#F0F0F0' }}>
              <div className="px-6 py-5" style={{ background: C.saffron }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Format 1 of 2</p>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.white, fontSize: '1.8rem', lineHeight: 1.05 }}>Immersive</h3>
                <p className="text-sm font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Cinematic · Full-page · Film-like</p>
              </div>
              {/* Full scene — natural aspect ratio, no cropping */}
              <img src="/styles/scene_immersive.png" alt="Immersive scene" className="w-full h-auto block" />
              <div className="px-6 py-5" style={{ background: C.white }}>
                <p className="text-sm leading-relaxed mb-3" style={{ color: C.gray }}>
                  Each page is a <strong style={{ color: C.navy }}>full-bleed cinematic illustration</strong> — rich scenery,
                  dramatic lighting, and your child at the centre of a vivid, beautiful world.
                </p>
                <div className="flex flex-wrap gap-5">
                  {['Deep scene detail', 'Immersive atmosphere', 'Perfect for bedtime'].map(f => (
                    <span key={f} className="text-xs font-bold" style={{ color: C.navy }}>✓ {f}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Comic Book */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="rounded-3xl overflow-hidden shadow-xl border" style={{ borderColor: '#F0F0F0' }}>
              <div className="px-6 py-5" style={{ background: C.navy }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Format 2 of 2</p>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.white, fontSize: '1.8rem', lineHeight: 1.05 }}>Comic Book</h3>
                <p className="text-sm font-semibold mt-1" style={{ color: C.gold }}>Bold · Action panels · Graphic novel</p>
              </div>
              {/* Full comic spread — natural aspect ratio, no cropping */}
              <img src="/styles/scene_comic.png" alt="Comic scene" className="w-full h-auto block" />
              <div className="px-6 py-5" style={{ background: C.white }}>
                <p className="text-sm leading-relaxed mb-3" style={{ color: C.gray }}>
                  Each page is a <strong style={{ color: C.navy }}>bold comic panel spread</strong> — punchy action captions,
                  dramatic angles, and your child leaping off every page like a graphic novel hero.
                </p>
                <div className="flex flex-wrap gap-5">
                  {['High-energy action', 'Bold captions', 'Reluctant readers love it'].map(f => (
                    <span key={f} className="text-xs font-bold" style={{ color: C.navy }}>✓ {f}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 5  AGE INTELLIGENCE — warm tint
      ══════════════════════════════════════════ */}
      <section style={{ background: C.warmTint }} className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Age intelligence')}
            {heading('Written for their exact age.')}
            <p className="text-sm mt-3 leading-relaxed" style={{ color: C.gray }}>
              Our AI calibrates every sentence — length, vocabulary, tone — precisely to your child's age.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {ageTiers.map((tier, i) => (
              <motion.div key={tier.range} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 sm:p-6"
                style={{ background: C.white, borderLeft: `5px solid ${tier.borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

                {/* Top row: emoji + range + tone + stat pills */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl flex-none">{tier.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold leading-tight" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy, fontSize: '1rem' }}>{tier.range}</p>
                    <p className="text-xs italic" style={{ color: C.lgray }}>{tier.tone}</p>
                  </div>
                  <div className="flex gap-2 flex-none">
                    {[['words/pg', tier.words], ['scenes', tier.scenes]].map(([lbl, val]) => (
                      <div key={lbl} className="text-center rounded-xl px-2.5 py-1.5" style={{ background: C.warmTint }}>
                        <p className="text-lg font-extrabold leading-none" style={{ fontFamily: "'Baloo 2', sans-serif", color: tier.borderColor }}>{val}</p>
                        <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: C.lgray }}>{lbl}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description below */}
                <p className="text-sm leading-relaxed" style={{ color: C.gray, paddingLeft: '2.25rem' }}>{tier.desc}</p>

              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 6  QUALITY & TRUST — white
      ══════════════════════════════════════════ */}
      <section style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Quality you can trust')}
            {heading(<>Every story is checked,<br />then checked again.</>)}
            <p className="text-sm mt-3 leading-relaxed max-w-xl" style={{ color: C.gray }}>
              Our AI writes your child's story, then a completely separate AI independently reviews everything.
              If anything falls short, it's rewritten — before you ever see it.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4 mb-5">
            {qualityItems.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 flex items-center gap-5"
                style={{ background: C.warmTint, borderLeft: `4px solid ${C.saffron}` }}>
                <span className="text-3xl flex-none">{item.emoji}</span>
                <div>
                  <p className="font-bold mb-0.5" style={{ color: C.navy }}>{item.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: C.gray }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Score card */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: C.warmTint, borderLeft: `4px solid ${C.gold}` }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.gray }}>Typical story quality score</p>
              <p className="text-xs" style={{ color: C.lgray }}>Reviewed by a human quality expert</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.saffron }}>9.8 / 10</p>
              <p style={{ fontSize: 15 }}>⭐⭐⭐⭐⭐</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 7  WHY IT MATTERS — navy
      ══════════════════════════════════════════ */}
      <section style={{ background: C.navy }} className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Why it matters', true)}
            {heading('A book with their name hits differently.', true)}
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Children engage more deeply and retain lessons better when they see themselves in the story.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {whyItems.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex items-start gap-4 p-5 rounded-2xl"
                style={{ background: C.navyCard, borderLeft: `4px solid ${C.saffron}` }}>
                <span className="text-2xl flex-none mt-0.5">{item.emoji}</span>
                <div>
                  <p className="font-bold mb-0.5" style={{ color: C.white }}>{item.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 8  HOW IT WORKS — warm gradient
      ══════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: C.gradient }} className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.15em' }}>Simple process</p>
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.white, fontSize: 'clamp(1.7rem,3.5vw,2.4rem)', lineHeight: 1.05 }}>
              From name to printed book.
            </h2>
            <p className="text-sm font-semibold mt-2" style={{ color: 'rgba(255,255,255,0.85)' }}>Minutes on your side. Magic behind the scenes.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { emoji: '📝', n: '01', title: 'Tell us about\nyour child',   desc: 'Name, age, photo, theme and art style.' },
              { emoji: '✍️', n: '02', title: 'AI writes\nthe story',        desc: 'Unique, personalised, quality-checked.' },
              { emoji: '🎨', n: '03', title: 'AI creates\nevery scene',     desc: 'Full-page illustrations, your child in each.' },
              { emoji: '📦', n: '04', title: 'Your book\nships',            desc: 'Hardcover to your door or instant PDF.' },
            ].map((step, i) => (
              <motion.div key={step.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.35)' }}>
                <span className="text-3xl block mb-3">{step.emoji}</span>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Step {step.n}</p>
                <p className="font-extrabold text-sm mb-2 whitespace-pre-line leading-snug"
                  style={{ fontFamily: "'Baloo 2', sans-serif", color: C.white }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center rounded-2xl py-4 px-8" style={{ background: 'rgba(255,255,255,0.92)' }}>
            <p className="font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy, fontSize: '1.1rem' }}>
              Starting at ₹{price} · protago.in
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.gray }}>Hardcover print delivered in 5–7 days</p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 9  ORDER FORM — warm tint
      ══════════════════════════════════════════ */}
      <OrderForm price={price} scrollTo={scrollTo} />

      {/* ══════════════════════════════════════════
          § 10  FAQ — white
      ══════════════════════════════════════════ */}
      <section id="faq" style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            {eyebrow('Common questions')}
            {heading('Got questions?')}
            <p className="text-sm mt-2" style={{ color: C.lgray }}>Everything you need to know before ordering.</p>
          </motion.div>

          <div className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden border transition-colors duration-200"
                style={{ borderColor: openFaq === i ? C.saffron : '#EBEBEB', background: openFaq === i ? '#FFF8F3' : C.white }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left">
                  <span className="flex-none w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold"
                    style={{ background: openFaq === i ? C.saffron : '#F3F4F6', color: openFaq === i ? C.white : C.lgray }}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-bold pr-2" style={{ color: openFaq === i ? '#3D1A00' : C.navy }}>
                    {faq.q}
                  </span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-none">
                    <ChevronDown size={16} style={{ color: openFaq === i ? C.saffron : '#D1D5DB' }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <p className="text-sm leading-relaxed pb-5" style={{ paddingLeft: '3.75rem', paddingRight: '1.25rem', color: C.gray }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 text-center">
            <p className="text-sm mb-2" style={{ color: C.lgray }}>Still have questions?</p>
            <a href="mailto:hello@protago.in" className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-70 transition-opacity"
              style={{ color: C.saffron }}>
              <MessageCircle size={14} /> hello@protago.in
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TEAM
      ══════════════════════════════════════════ */}
      <section style={{ background: C.warmTint }} className="py-16 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
              Meet the Team
            </h2>
            <p className="text-sm mb-10" style={{ color: C.lgray }}>An initiative by IIT Kanpur alumni</p>
            <div className="flex flex-col sm:flex-row justify-center gap-8">
              {[
                { name: 'Piyush Kumar', role: 'Co-Founder & CEO', edu: 'B.Tech, IIT Kanpur', photo: '/team/piyush.jpg', linkedin: 'https://linkedin.com/in/kpiyush25', twitter: 'https://x.com/PiyushKThisSide/' },
                { name: 'Shorya Kumar', role: 'Co-Founder & CTO', edu: 'B.Tech, IIT Kanpur', photo: '/team/shorya.jpg', linkedin: 'https://www.linkedin.com/in/shoryak/', twitter: 'https://x.com/meet_shoryak' },
              ].map(({ name, role, edu, photo, linkedin, twitter }) => (
                <div key={name} className="flex flex-col items-center gap-3 flex-1 max-w-xs mx-auto">
                  <img src={photo} alt={name}
                    className="w-72 h-72 rounded-full object-cover object-top"
                    style={{ border: `3px solid ${C.saffron}` }} />
                  <div className="text-center">
                    <p className="font-extrabold text-lg" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>{name}</p>
                    <p className="text-sm font-semibold" style={{ color: C.saffron }}>{role}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.lgray }}>{edu}</p>
                    <div className="flex justify-center gap-3 mt-2">
                      <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" style={{ color: C.navy }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                      <a href={twitter} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" style={{ color: C.navy }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — navy
      ══════════════════════════════════════════ */}
      <footer style={{ background: C.navy }} className="pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            <div id="footer-contact">
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.saffron }}>protago</span>
              <p className="text-sm mt-3 leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Magical, personalised storybooks that make every Indian child the hero of their own adventure.
              </p>
              <a href="mailto:hello@protago.in" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity mb-2"
                style={{ color: C.gold }}>
                <MessageCircle size={14} /> hello@protago.in
              </a>
              <a href="https://wa.me/919452868857" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm mt-2 hover:opacity-80 transition-opacity"
                style={{ color: C.gold }}>
                <MessageCircle size={14} /> WhatsApp: +91 94528 68857
              </a>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Explore</h4>
              <ul className="space-y-3">
                {[['Art Styles','art-styles'],['How It Works','how-it-works'],['FAQ','faq']].map(([label, id]) => (
                  <li key={id}>
                    <button onClick={() => scrollTo(id)} className="text-sm hover:text-white transition-colors"
                      style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</button>
                  </li>
                ))}
                <li><button onClick={() => scrollTo('footer-contact')} className="text-sm hover:text-white transition-colors"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>Contact Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Secure Payments</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Razorpay','UPI','Cards','Net Banking'].map(p => (
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
              {[['Privacy Policy','/privacy'],['Terms & Conditions','/terms'],['Refund Policy','/refund']].map(([label, href]) => (
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
