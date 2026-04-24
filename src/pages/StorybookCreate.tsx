import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  Shield,
  ArrowLeft,
  ArrowRight,
  X,
  CheckCircle,
  Mail,
  Phone,
  Clock,
  Truck,
  Loader2,
} from 'lucide-react';
import { trackButtonClick, trackFormInteraction } from '../utils/analytics';
import { storybooks } from '../data/storybooks';

export function StorybookCreate() {
  const { bookSlug } = useParams<{ bookSlug: string }>();
  const navigate = useNavigate();

  const book = storybooks.find(b => b.slug === bookSlug);

  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childGender, setChildGender] = useState<'' | 'boy' | 'girl'>('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [shippingName, setShippingName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [pincode, setPincode] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serverPhotoPath, setServerPhotoPath] = useState<string | null>(null);
  const [serverPhotoMeta, setServerPhotoMeta] = useState<{
    mime_type?: string;
    file_size_bytes?: number;
    width?: number;
    height?: number;
    original_filename?: string;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [completedOrderId, setCompletedOrderId] = useState('');
  const [price, setPrice] = useState<number>(Number(import.meta.env.VITE_STORYBOOK_PRICE) || 499);
  const [previewSlide, setPreviewSlide] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OTP verification state
  type OtpStep = 'idle' | 'sending' | 'awaiting' | 'verifying';
  const [otpStep, setOtpStep] = useState<OtpStep>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string; phone?: string;
    shippingName?: string; addressLine1?: string; city?: string;
    addressState?: string; pincode?: string;
  }>({});

  const previews = book?.previewImages ?? [];
  const captions = book?.previewCaptions ?? [];

  useEffect(() => {
    if (previewPaused || previews.length === 0) return;
    const t = setInterval(() => setPreviewSlide(i => (i + 1) % previews.length), 2000);
    return () => clearInterval(t);
  }, [previewPaused, previews.length]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  // Prefer explicit API base from env (e.g. Railway URL) and
  // fall back to same-origin in production or localhost in dev.
  // Empty string = same-origin, so Vite proxy forwards /api/* to the backend in dev.
  // In production, VITE_API_BASE_URL points to Railway; without it, same-origin works too.
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/storybook-price`)
      .then(res => res.json())
      .then(data => { if (data.price) setPrice(data.price); })
      .catch(() => {});
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setPhotoPreview(dataUrl);
        // Upload to server to get a short-lived signed preview URL
        try {
          const resp = await fetch(`${API_BASE}/api/upload-photo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: dataUrl }),
          });
          if (resp.ok) {
            const json = await resp.json();
            if (json.photo_signed_url) {
              setPhotoPreview(json.photo_signed_url);
            }
            if (json.photo_url) setServerPhotoPath(json.photo_url);
            if (json.mime_type || json.file_size_bytes) {
              setServerPhotoMeta({
                mime_type: json.mime_type,
                file_size_bytes: json.file_size_bytes,
                width: json.width,
                height: json.height,
                original_filename: json.original_filename,
              });
            }
          }
        } catch (err) {
          // ignore upload preview failure; local preview still shows
        }
      };
      reader.readAsDataURL(file);
      trackFormInteraction('photo_uploaded', 'photo');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 1: validate form, send OTP — called on form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackButtonClick('place_order', 'order_section');

    if (!childGender) {
      setPaymentError('Please select your child\'s gender.');
      return;
    }

    // Client-side validation
    const errors: typeof fieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail.trim()))
      errors.email = 'Please enter a valid email address';
    const digits = parentPhone.replace(/\D/g, '').replace(/^(0|91)/, '');
    if (!/^\d{10}$/.test(digits))
      errors.phone = 'Please enter a valid 10-digit mobile number';
    if (!shippingName.trim())
      errors.shippingName = 'Please enter the recipient name';
    if (!addressLine1.trim())
      errors.addressLine1 = 'Please enter your address';
    if (!city.trim())
      errors.city = 'Please enter your city';
    if (!addressState)
      errors.addressState = 'Please select your state';
    if (!/^\d{6}$/.test(pincode))
      errors.pincode = 'Please enter a valid 6-digit PIN code';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setOtpStep('sending');
    setPaymentError('');
    setOtpCode('');
    setOtpError('');

    try {
      const res = await fetch(`${API_BASE}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: parentPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpStep('awaiting');
      setResendCountdown(30);
    } catch (err) {
      setOtpStep('idle');
      setPaymentError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    }
  };

  // Step 2: verify OTP — called from the OTP modal
  const handleOtpVerify = async () => {
    if (otpCode.length < 6) {
      setOtpError('Please enter the 6-digit OTP.');
      return;
    }
    setOtpStep('verifying');
    setOtpError('');

    try {
      const res = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: parentPhone, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect OTP');
      setOtpStep('idle');
      await proceedWithOrder(data.otpToken);
    } catch (err) {
      setOtpStep('awaiting');
      setOtpError(err instanceof Error ? err.message : 'Incorrect OTP. Please try again.');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpError('');
    setOtpCode('');
    try {
      await fetch(`${API_BASE}/api/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: parentPhone }),
      });
      setResendCountdown(30);
    } catch {
      setOtpError('Failed to resend. Please try again.');
    }
  };

  // Step 3: create order + open Razorpay — called after OTP verified
  const proceedWithOrder = async (token: string) => {
    setIsProcessing(true);
    setPaymentError('');

    try {
      const res = await fetch(`${API_BASE}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName,
          childAge,
          childGender,
          parentEmail,
          parentPhone,
          shippingName,
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          state: addressState,
          pincode,
          bookSlug: book.slug,
          otpToken: token,
          photoPath: serverPhotoPath || null,
          photoMeta: serverPhotoMeta || null,
          photo: serverPhotoPath ? null : photoPreview || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const {
        orderId,
        razorpayKeyId,
        amount,
        currency,
        photo_url: serverPhotoPathFromResponse,
        photo_signed_url: serverPhotoSignedUrl,
      } = await res.json();

      if (serverPhotoSignedUrl) setPhotoPreview(serverPhotoSignedUrl);
      if (serverPhotoPathFromResponse) setServerPhotoPath(serverPhotoPathFromResponse);

      if (!razorpayKeyId || razorpayKeyId.includes('your_')) {
        setCompletedOrderId(orderId);
        setShowModal(true);
        setFormSubmitted(true);
        setIsProcessing(false);
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Little Angels Storybook',
        description: `${book?.title || 'Personalised Storybook'} for ${childName}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            setCompletedOrderId(orderId);
            setShowModal(true);
            setFormSubmitted(true);
          } catch {
            setPaymentError('Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: { name: childName, email: parentEmail, contact: parentPhone },
        theme: { color: '#9333ea' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentError('Payment was cancelled. Please try again.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setIsProcessing(false);
      setPaymentError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  // If book not found, show a fallback
  if (!book) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Book not found</h2>
          <p className="text-gray-500 mb-6">We couldn't find the storybook you're looking for.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
          >
            <ArrowLeft size={16} />
            Browse All Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <BookOpen size={22} className="text-purple-600" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">Little Angels</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Collection
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="pt-14 min-h-screen">

        {/* ── SPLIT: preview | form ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

            {/* ── LEFT: Image preview slider ── */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="w-full lg:w-[46%] lg:sticky lg:top-[4.5rem] shrink-0"
              onMouseEnter={() => setPreviewPaused(true)}
              onMouseLeave={() => setPreviewPaused(false)}
            >
              {/* Dark outer frame with padding = whitespace around image */}
              <div className="bg-gray-950 rounded-3xl p-3 sm:p-4">
                <div className="relative rounded-2xl overflow-hidden aspect-square">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={previewSlide}
                      src={previews[previewSlide]}
                      alt={`${book.title} preview ${previewSlide + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  </AnimatePresence>

                  {/* Prev / Next arrows */}
                  <button
                    onClick={() => setPreviewSlide(i => (i - 1 + previews.length) % previews.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <button
                    onClick={() => setPreviewSlide(i => (i + 1) % previews.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10"
                  >
                    <ArrowRight size={15} />
                  </button>

                  {/* Top overlay */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent px-5 pt-5 pb-10">
                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest mb-0.5">Sample Preview</p>
                    <p className="text-white font-extrabold text-base leading-tight">{book.title}</p>
                  </div>

                  {/* Bottom overlay — dots + counter */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-5 pb-4 pt-8">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {previews.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPreviewSlide(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === previewSlide ? 'bg-white w-5' : 'bg-white/35 w-1.5'}`}
                          />
                        ))}
                      </div>
                      <span className="text-white/50 text-xs font-medium tabular-nums">{previewSlide + 1} / {previews.length}</span>
                    </div>
                  </div>
                </div>

                {/* Animated caption per slide */}
                <div className="px-2 pt-4 pb-2 min-h-[5.5rem]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={previewSlide}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="text-white/35 text-[9px] font-bold uppercase tracking-widest mb-2">
                        {previewSlide === 0 ? 'Cover' : `Page ${previewSlide}`}
                      </p>
                      <p className="text-white font-semibold text-base leading-snug">
                        {captions[previewSlide]}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10 text-white/30 text-xs">
                    <span>{book.age}</span>
                    <span>·</span>
                    <span>{book.pages} pages</span>
                    <span>·</span>
                    <span>Hardcover</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── RIGHT: Form ── */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{book.icon}</span>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personalise this book</p>
                  <h3 className="text-lg font-extrabold text-gray-900 leading-tight">{book.title}</h3>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {formSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-3xl overflow-hidden border border-gray-100 shadow-md"
                  >
                    {/* Green confirmation banner */}
                    <div className="bg-emerald-500 px-6 py-5 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-none">
                        <CheckCircle size={22} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-extrabold text-lg leading-tight">Order Confirmed!</p>
                        <p className="text-emerald-100 text-xs mt-0.5">We've received your order and are getting started</p>
                      </div>
                    </div>

                    {/* Order details */}
                    <div className="bg-white px-6 py-5">
                      <div className="flex gap-4 mb-5">
                        {/* Book thumbnail */}
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-16 h-22 rounded-xl object-cover flex-none shadow-sm"
                          style={{ height: '5.5rem' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{book.theme}</p>
                          <p className="font-extrabold text-gray-900 leading-snug mb-0.5">{book.title}</p>
                          <p className="text-sm text-gray-500">Personalised for <span className="font-semibold text-gray-700">{childName}</span></p>
                          <p className="text-sm font-bold text-emerald-600 mt-1">₹{price} paid</p>
                        </div>
                      </div>

                      {completedOrderId && (
                        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Order ID</p>
                          <p className="text-sm font-mono font-semibold text-gray-700">{completedOrderId}</p>
                        </div>
                      )}

                      {/* What happens next */}
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">What happens next</p>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                          <span className="text-base">🎨</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">AI personalisation</p>
                            <p className="text-xs text-gray-400">We place {childName}'s face on every page of the story</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-base">🖨️</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Premium printing</p>
                            <p className="text-xs text-gray-400">Hardcover, 200GSM glossy paper — printed with care</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-base">📦</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Delivered in 5–7 business days</p>
                            <p className="text-xs text-gray-400">Updates sent to {parentEmail || parentPhone}</p>
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold text-sm"
                      >
                        Browse More Books
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubmit}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-md"
                  >
                    {/* Child details */}
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">1</span>
                      About your child
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Child's name</label>
                        <input
                          type="text"
                          required
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          onFocus={() => trackFormInteraction('focus', 'child_name')}
                          placeholder="e.g. Aarav, Ananya"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Child's age</label>
                        <select
                          aria-label="Child's age"
                          required
                          value={childAge}
                          onChange={(e) => setChildAge(e.target.value)}
                          onFocus={() => trackFormInteraction('focus', 'child_age')}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                        >
                          <option value="">Select age</option>
                          {[2,3,4,5,6,7,8,9,10].map(a => (
                            <option key={a} value={a}>{a} years</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Child's gender</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => { setChildGender('boy'); trackFormInteraction('select', 'gender_boy'); }}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            childGender === 'boy'
                              ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          👦 Boy
                        </button>
                        <button
                          type="button"
                          onClick={() => { setChildGender('girl'); trackFormInteraction('select', 'gender_girl'); }}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            childGender === 'girl'
                              ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          👧 Girl
                        </button>
                      </div>
                    </div>

                    {/* Photo */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-0.5">Child's photo</label>
                      <p className="text-xs text-gray-400 mb-2">We use AI to put their real face on every page 🪄</p>
                      {photoPreview ? (
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <img src={photoPreview} alt="Preview" className="w-14 h-14 object-cover rounded-xl" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Photo uploaded</p>
                            <p className="text-xs text-gray-400">Looking great!</p>
                          </div>
                          <button
                            aria-label="Remove photo"
                            type="button"
                            onClick={handleRemovePhoto}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 w-full p-3.5 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Upload size={16} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Click to upload</p>
                            <p className="text-xs text-gray-400">JPG or PNG, up to 5 MB</p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Parent details */}
                    <div className="border-t border-gray-100 pt-5 mb-4">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">2</span>
                        Where should we send it?
                      </h4>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                          <input
                            type="email"
                            required
                            value={parentEmail}
                            onChange={(e) => { setParentEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })); }}
                            onFocus={() => trackFormInteraction('focus', 'parent_email')}
                            placeholder="you@email.com"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all text-sm ${fieldErrors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'}`}
                          />
                          {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                          <input
                            type="tel"
                            required
                            value={parentPhone}
                            onChange={(e) => {
                              // Strip non-digits, remove +91/91/0 prefix, cap at 10 digits
                              const digits = e.target.value.replace(/\D/g, '').replace(/^(91|0)/, '').slice(0, 10);
                              setParentPhone(digits);
                              setFieldErrors(prev => ({ ...prev, phone: undefined }));
                            }}
                            onFocus={() => trackFormInteraction('focus', 'parent_phone')}
                            placeholder="10-digit mobile number"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all text-sm ${fieldErrors.phone ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'}`}
                          />
                          {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Shipping address */}
                    <div className="border-t border-gray-100 pt-5 mb-4">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">3</span>
                        Shipping address
                      </h4>
                    </div>

                    {/* Full name */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full name <span className="text-gray-400 font-normal">(for shipping label)</span></label>
                      <input
                        type="text"
                        required
                        value={shippingName}
                        onChange={e => { setShippingName(e.target.value); setFieldErrors(p => ({ ...p, shippingName: undefined })); }}
                        placeholder="Recipient's full name"
                        className={`w-full px-3.5 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all text-sm ${fieldErrors.shippingName ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'}`}
                      />
                      {fieldErrors.shippingName && <p className="text-xs text-red-500 mt-1">{fieldErrors.shippingName}</p>}
                    </div>

                    {/* Address line 1 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address line 1</label>
                      <input
                        type="text"
                        required
                        value={addressLine1}
                        onChange={e => { setAddressLine1(e.target.value); setFieldErrors(p => ({ ...p, addressLine1: undefined })); }}
                        placeholder="House / flat no., street name"
                        className={`w-full px-3.5 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all text-sm ${fieldErrors.addressLine1 ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'}`}
                      />
                      {fieldErrors.addressLine1 && <p className="text-xs text-red-500 mt-1">{fieldErrors.addressLine1}</p>}
                    </div>

                    {/* Address line 2 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address line 2 <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={e => setAddressLine2(e.target.value)}
                        placeholder="Area, locality, landmark"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* City + PIN */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={e => { setCity(e.target.value); setFieldErrors(p => ({ ...p, city: undefined })); }}
                          placeholder="Mumbai"
                          className={`w-full px-3.5 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all text-sm ${fieldErrors.city ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'}`}
                        />
                        {fieldErrors.city && <p className="text-xs text-red-500 mt-1">{fieldErrors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN code</label>
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          value={pincode}
                          onChange={e => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setFieldErrors(p => ({ ...p, pincode: undefined })); }}
                          placeholder="400001"
                          maxLength={6}
                          className={`w-full px-3.5 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all text-sm ${fieldErrors.pincode ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'}`}
                        />
                        {fieldErrors.pincode && <p className="text-xs text-red-500 mt-1">{fieldErrors.pincode}</p>}
                      </div>
                    </div>

                    {/* State */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        required
                        value={addressState}
                        onChange={e => { setAddressState(e.target.value); setFieldErrors(p => ({ ...p, addressState: undefined })); }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all text-sm bg-white ${fieldErrors.addressState ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'}`}
                      >
                        <option value="">Select state / UT</option>
                        {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {fieldErrors.addressState && <p className="text-xs text-red-500 mt-1">{fieldErrors.addressState}</p>}
                    </div>

                    {/* Price summary */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{book.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Hardcover · {book.pages} pages · Free delivery</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">₹{price}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing || otpStep === 'sending'}
                      className="w-full py-3.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-base"
                    >
                      {otpStep === 'sending' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending OTP…
                        </>
                      ) : isProcessing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing…
                        </>
                      ) : (
                        `🎁 Order ${book.title} — ₹${price}`
                      )}
                    </button>

                    {paymentError && (
                      <p className="text-sm text-red-500 text-center mt-2">{paymentError}</p>
                    )}

                    <div className="flex items-center justify-center gap-5 mt-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Shield size={11} /> Secure payment</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> 5–7 business day delivery</span>
                      <span className="flex items-center gap-1"><Truck size={11} /> Free shipping</span>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

            </motion.div>{/* close right panel */}
          </div>{/* close flex row */}
        </div>{/* close max-w-5xl container */}

        {/* ── YOU MIGHT ALSO LIKE — full width ── */}
        <div className="bg-gray-50 border-t border-gray-100 py-10 mt-4">
          <div className="max-w-5xl mx-auto px-5 sm:px-8">
            <h3 className="text-base font-bold text-gray-900 mb-5">You might also like</h3>
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              {storybooks
                .filter(b => b.slug !== book.slug)
                .slice(0, 3)
                .map((b) => (
                  <div
                    key={b.slug}
                    onClick={() => { navigate(`/create/${b.slug}`); window.scrollTo(0, 0); }}
                    className="cursor-pointer group"
                  >
                    <div className="relative rounded-2xl overflow-hidden aspect-square group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                      <img src={b.cover} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                        <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider mb-0.5">{b.theme}</p>
                        <p className="text-white font-bold text-sm leading-tight">{b.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <BookOpen size={16} className="text-purple-400" />
              <span className="font-bold text-white tracking-tight">Little Angels</span>
            </Link>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <a href="mailto:hello@icurious.ai" className="hover:text-gray-300 transition-colors">
                hello@icurious.ai
              </a>
              <span>&middot;</span>
              <span>IIT Kanpur &amp; AIIMS Delhi Alumni</span>
            </div>
            <span className="text-xs text-gray-600">&copy; {new Date().getFullYear()} iCurious AI</span>
          </div>
        </div>
      </footer>

      {/* ── OTP VERIFICATION MODAL ── */}
      <AnimatePresence>
        {(otpStep === 'awaiting' || otpStep === 'verifying') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-purple-600 px-6 py-5">
                <p className="text-white font-extrabold text-lg">Verify your number</p>
                <p className="text-purple-200 text-xs mt-0.5">
                  We sent a 6-digit OTP to{' '}
                  <span className="font-semibold text-white">
                    +91 ••••••{parentPhone.replace(/\D/g, '').slice(-4)}
                  </span>
                </p>
              </div>

              <div className="px-6 py-6">
                {/* OTP input */}
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleOtpVerify()}
                  placeholder="------"
                  autoFocus
                  className="w-full text-center text-3xl font-extrabold tracking-[0.5em] border-2 border-gray-200 focus:border-purple-500 rounded-2xl py-4 outline-none transition-colors placeholder:text-gray-200"
                />

                {/* Error */}
                {otpError && (
                  <p className="text-red-500 text-xs text-center mt-2">{otpError}</p>
                )}

                {/* Verify button */}
                <button
                  onClick={handleOtpVerify}
                  disabled={otpStep === 'verifying' || otpCode.length < 6}
                  className="mt-4 w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {otpStep === 'verifying' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Verifying…
                    </>
                  ) : 'Verify & Continue'}
                </button>

                {/* Resend + edit number */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                  </button>
                  <button
                    onClick={() => { setOtpStep('idle'); setOtpCode(''); setOtpError(''); }}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Edit number
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
            >
              {/* Banner */}
              <div className="bg-emerald-500 px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-none">
                  <CheckCircle size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-extrabold text-lg leading-tight">Order Confirmed!</p>
                  <p className="text-emerald-100 text-xs mt-0.5">Your magical book is on its way</p>
                </div>
              </div>

              <div className="px-6 py-5">
                {/* Book summary */}
                <div className="flex gap-3 mb-4">
                  <img src={book.cover} alt={book.title} className="w-14 rounded-lg object-cover flex-none shadow-sm" style={{ height: '4.5rem' }} />
                  <div>
                    <p className="font-extrabold text-gray-900 leading-snug text-sm">{book.title}</p>
                    <p className="text-xs text-gray-500">For <span className="font-semibold">{childName}</span></p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">₹{price} paid</p>
                  </div>
                </div>

                {completedOrderId && (
                  <div className="bg-gray-50 rounded-xl px-3.5 py-2.5 mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Order ID</p>
                    <p className="text-xs font-mono font-semibold text-gray-700">{completedOrderId}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-4">
                  Estimated delivery in <span className="font-semibold text-gray-600">5–7 business days</span>. Updates sent to {parentEmail || parentPhone}.
                </p>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold text-sm"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
