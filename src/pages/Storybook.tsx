import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  MessageCircle,
  Menu,
  X,
} from 'lucide-react';
import { trackButtonClick, trackSectionView } from '../utils/analytics';
import { storybooks } from '../data/storybooks';

function SectionTracker({ name, children }: { name: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  useEffect(() => { if (isInView) trackSectionView(name); }, [isInView, name]);
  return <div ref={ref}>{children}</div>;
}

const faqs = [
  {
    q: 'How does the personalisation work?',
    a: 'You share your child\'s name, gender, and photos. Our AI creates face embeddings and recreates your child\'s likeness across every page of the story, making them the true hero of the adventure.',
  },
  {
    q: 'How long does delivery take?',
    a: 'We deliver within 5–7 business days across India. Each book is printed on premium 300GSM glossy paper and carefully packaged to arrive in perfect condition.',
  },
  {
    q: 'What age group are these books for?',
    a: 'We have stories for children aged 3–9 years, with age-appropriate language and themes. Each book listing shows the recommended age range.',
  },
  {
    q: 'Can I see what the book looks like before buying?',
    a: 'Yes! We provide sample previews featuring other children so you can see the illustration quality, storytelling style, and print finish before placing your order.',
  },
  {
    q: 'What if I\'m not satisfied with the book?',
    a: 'We want every family to be delighted. If you\'re not happy with your book, reach out to us within 7 days and we\'ll work with you to make it right or offer a full refund.',
  },
];


export function Storybook() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const price = Number(import.meta.env.VITE_STORYBOOK_PRICE) || 499;

  useEffect(() => {
    if (carouselPaused) return;
    const t = setInterval(() => setActiveSlide(i => (i + 1) % storybooks.length), 2000);
    return () => clearInterval(t);
  }, [carouselPaused]);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => scrollTo('hero')} className="flex items-center gap-2.5">
              <BookOpen size={22} className="text-purple-600" />
              <span className="text-lg font-bold text-purple-700 tracking-tight">Little Angels</span>
            </button>

            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => { scrollTo('books'); trackButtonClick('nav_our_books', 'header'); }}
                className="text-sm text-gray-500 hover:text-purple-600 transition-colors font-medium"
              >
                Our Books
              </button>
              <button
                onClick={() => { scrollTo('how-it-works'); trackButtonClick('nav_how_it_works', 'header'); }}
                className="text-sm text-gray-500 hover:text-purple-600 transition-colors font-medium"
              >
                How It Works
              </button>
              <button
                onClick={() => { scrollTo('faq'); trackButtonClick('nav_faq', 'header'); }}
                className="text-sm text-gray-500 hover:text-purple-600 transition-colors font-medium"
              >
                FAQ
              </button>
              <button
                onClick={() => { scrollTo('books'); trackButtonClick('nav_get_started', 'header'); }}
                className="px-5 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors text-sm font-semibold"
              >
                Get Started
              </button>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden"
              >
                <div className="py-4 flex flex-col gap-3 border-t border-gray-100 mt-3">
                  <button onClick={() => scrollTo('books')} className="text-sm text-gray-600 text-left py-1">Our Books</button>
                  <button onClick={() => scrollTo('how-it-works')} className="text-sm text-gray-600 text-left py-1">How It Works</button>
                  <button onClick={() => scrollTo('faq')} className="text-sm text-gray-600 text-left py-1">FAQ</button>
                  <button
                    onClick={() => scrollTo('books')}
                    className="mt-1 px-5 py-2.5 bg-purple-600 text-white rounded-full text-sm font-semibold text-center"
                  >
                    Get Started
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── HERO ── */}
      <SectionTracker name="hero">
        <section id="hero" className="pt-20 pb-0 bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="rounded-3xl overflow-hidden bg-purple-50 flex flex-col sm:flex-row">

              {/* Left — text (order-2 on mobile so image shows first) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="order-2 sm:order-1 flex-none w-full sm:w-[42%] flex flex-col justify-center px-7 py-8 sm:py-0 sm:px-8 lg:px-12"
              >
                {/* Eyebrow — synced with carousel slide */}
                <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 w-fit overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activeSlide}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1.5"
                    >
                      <span>{storybooks[activeSlide].icon}</span>
                      <span>{storybooks[activeSlide].theme}</span>
                    </motion.span>
                  </AnimatePresence>
                </div>

                <h1 className="text-2xl sm:text-[1.75rem] lg:text-[2rem] font-extrabold text-gray-900 leading-tight mb-2.5">
                  Your Child,<br className="hidden sm:block" /> the Hero
                </h1>

                <p className="text-sm text-gray-500 leading-relaxed mb-3">
                  Adventures that put their real face on every page — and teach values they'll carry for life.
                </p>

                {/* Theme chips */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {storybooks.map(b => (
                    <span key={b.slug} className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 ${b.tagBg}`}>
                      {b.icon} {b.theme}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => { scrollTo('books'); trackButtonClick('hero_browse_collection', 'hero'); }}
                  className="group px-5 py-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors font-bold flex items-center gap-2 text-sm w-fit mb-4"
                >
                  Browse Our Collection
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Social proof */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xs">★</span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">Loved by 500+ families · from ₹{price}</span>
                </div>
              </motion.div>

              {/* Right — cover image carousel */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="order-1 sm:order-2 w-full sm:flex-1 relative h-[280px] sm:h-auto sm:aspect-square sm:max-h-[480px]"
                onMouseEnter={() => setCarouselPaused(true)}
                onMouseLeave={() => setCarouselPaused(false)}
              >
                {/* All images rendered once — opacity-animated to avoid re-fetches on slide change */}
                {storybooks.map((book, i) => (
                  <motion.img
                    key={book.cover}
                    src={book.cover}
                    alt={book.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    animate={{ opacity: i === activeSlide ? 1 : 0, x: i === activeSlide ? 0 : (i < activeSlide ? -60 : 60) }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    style={{ zIndex: i === activeSlide ? 1 : 0 }}
                  />
                ))}

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent px-6 pb-5 pt-16">
                  <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Real Sample</p>
                  <p className="text-white font-extrabold text-base leading-tight">{storybooks[activeSlide].title}</p>
                </div>

                {/* Dot indicators */}
                <div className="absolute bottom-4 right-5 flex gap-1.5">
                  {storybooks.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === activeSlide ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`}
                    />
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </section>
      </SectionTracker>

      {/* ── BOOK COLLECTION ── */}
      <SectionTracker name="books">
        <section id="books" className="py-10 sm:py-14 bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-7"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1.5">
                Adventures &amp; values
              </h2>
              <p className="text-sm text-gray-500">Each story puts your child front and centre — and teaches a value they'll carry for life.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {storybooks.map((book, i) => (
                <motion.div
                  key={book.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -5 }}
                  className="cursor-pointer group"
                  onClick={() => {
                    trackButtonClick(`book_${book.slug}`, 'collection');
                    navigate(`/create/${book.slug}`);
                  }}
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-square group-hover:shadow-xl transition-all duration-300">
                    <img src={book.cover} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute top-3 right-3 text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {book.age}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                      <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">{book.theme}</span>
                      <h3 className="text-white font-extrabold text-base leading-tight mb-0.5">{book.title}</h3>
                      <p className="text-white/65 text-xs mb-3">{book.subtitle}</p>
                      <div className="flex items-center gap-1.5 text-white text-xs font-bold group-hover:gap-2.5 transition-all">
                        <span>Personalise</span>
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </SectionTracker>

      {/* ── HOW IT WORKS ── */}
      <SectionTracker name="how_it_works">
        <section id="how-it-works" className="py-16 sm:py-24 bg-gradient-to-br from-violet-50 via-pink-50 to-amber-50">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                ✦ Simple process
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                From click to <span className="text-purple-600">keepsake</span>
              </h2>
              <p className="text-gray-500 text-base">Order today, delivered in 5–7 business days anywhere in India.</p>
            </motion.div>

            {/* Cards — horizontal scroll on mobile, flex row with arrows on desktop */}
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-5 px-5 lg:mx-0 lg:px-0 lg:overflow-visible lg:items-stretch snap-x snap-mandatory">
              {[
                { emoji: '📖', cardBg: 'bg-amber-50',   border: 'border-amber-100', label: 'text-amber-600',   n: '01', title: 'Pick your story',        desc: 'Browse 4 adventures. Choose the one your child will treasure.' },
                { emoji: '📸', cardBg: 'bg-sky-50',     border: 'border-sky-100',   label: 'text-sky-600',     n: '02', title: 'Personalise with photos', desc: 'Add their name, age, and a photo. Takes less than a minute.' },
                { emoji: '🤖', cardBg: 'bg-rose-50',    border: 'border-rose-100',  label: 'text-rose-600',    n: '03', title: 'AI creates the magic',   desc: "Your child's real face goes on every single page of the story." },
                { emoji: '📦', cardBg: 'bg-emerald-50', border: 'border-emerald-100', label: 'text-emerald-700', n: '04', title: 'Delivered to your door', desc: '300GSM glossy hardcover, beautifully packaged, free shipping.' },
              ].flatMap((item, i, arr) => {
                const card = (
                  <motion.div
                    key={`card-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex-none w-[72vw] lg:flex-1 snap-start ${item.cardBg} border ${item.border} rounded-3xl p-6`}
                  >
                    <span className="text-3xl block mb-4">{item.emoji}</span>
                    <p className={`text-[10px] font-bold ${item.label} uppercase tracking-widest mb-1.5`}>Step {item.n}</p>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
                if (i < arr.length - 1) {
                  return [card, (
                    <div key={`arrow-${i}`} className="hidden lg:flex items-center justify-center flex-none">
                      <ArrowRight size={18} className="text-purple-300" />
                    </div>
                  )];
                }
                return [card];
              })}
            </div>

            {/* Mobile swipe hint dots */}
            <div className="flex justify-center gap-1.5 mt-5 sm:hidden">
              {[0,1,2,3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-200" />
              ))}
            </div>
          </div>
        </section>
      </SectionTracker>

      {/* ── FAQ ── */}
      <SectionTracker name="faq">
        <section id="faq" className="py-16 sm:py-24 bg-white">
          <div className="max-w-2xl mx-auto px-5 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                ✦ Common questions
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                Got <span className="text-purple-600">questions?</span>
              </h2>
              <p className="text-sm text-gray-400">Everything you need to know before ordering.</p>
            </motion.div>

            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border overflow-hidden transition-colors duration-200 ${openFaq === i ? 'border-purple-200 bg-purple-50' : 'border-gray-100 bg-white'}`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  >
                    <span className={`flex-none w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-colors ${openFaq === i ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {i + 1}
                    </span>
                    <span className={`flex-1 text-sm font-bold pr-2 transition-colors ${openFaq === i ? 'text-purple-900' : 'text-gray-900'}`}>{faq.q}</span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-none"
                    >
                      <ChevronDown size={16} className={openFaq === i ? 'text-purple-500' : 'text-gray-300'} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <p className="pl-15 pr-5 pb-5 text-sm text-purple-800/70 leading-relaxed" style={{ paddingLeft: '3.75rem' }}>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Still have questions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-gray-400 mb-2">Still have questions?</p>
              <a
                href="mailto:hello@icurious.ai"
                className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                <MessageCircle size={14} />
                hello@icurious.ai
              </a>
            </motion.div>
          </div>
        </section>
      </SectionTracker>

      {/* ── FINAL CTA ── */}
      <section className="py-16 sm:py-20 bg-purple-600">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Give your child a story they'll cherish forever
            </h2>
            <p className="text-purple-200 mb-8 max-w-lg mx-auto">
              Every child deserves to be the hero. Browse our collection and create a personalised storybook today.
            </p>
            <button
              onClick={() => { scrollTo('books'); trackButtonClick('final_cta_browse', 'final_cta'); }}
              className="px-8 py-4 bg-white text-purple-700 rounded-full hover:bg-purple-50 transition-colors font-bold text-base"
            >
              Browse Collection — Starting ₹{price}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">

          {/* Top row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <BookOpen size={22} className="text-purple-400" />
                <span className="text-lg font-extrabold text-white tracking-tight">Little Angels</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">
                Magical, personalised storybooks that make every child the hero of their own adventure.
              </p>
              <a href="mailto:hello@icurious.ai" className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium">
                <MessageCircle size={14} />
                hello@icurious.ai
              </a>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Explore</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollTo('books')} className="text-sm text-gray-400 hover:text-white transition-colors">Our Books</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => scrollTo('faq')} className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</button></li>
                <li><a href="mailto:hello@icurious.ai" className="text-sm text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Trust */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Secure Payments</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-semibold text-gray-300 bg-gray-800 rounded-full px-3 py-1.5">Razorpay</span>
                <span className="text-xs font-semibold text-gray-300 bg-gray-800 rounded-full px-3 py-1.5">UPI</span>
                <span className="text-xs font-semibold text-gray-300 bg-gray-800 rounded-full px-3 py-1.5">Cards</span>
                <span className="text-xs font-semibold text-gray-300 bg-gray-800 rounded-full px-3 py-1.5">Net Banking</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">An initiative by IIT Kanpur &amp; AIIMS Delhi alumni</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-gray-600">&copy; {new Date().getFullYear()} iCurious AI. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="text-gray-700">·</span>
              <span className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">Terms of Service</span>
              <span className="text-gray-700">·</span>
              <span className="text-xs text-gray-600">Made with love in India 🇮🇳</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
