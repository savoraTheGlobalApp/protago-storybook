import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const C = {
  saffron: '#FF6B35', gray: '#555555', lgray: '#999999', navy: '#1A1A2E',
  gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7B731 100%)',
};

const NAV_LINKS = [
  { label: 'Books',        anchor: 'books' },
  { label: 'Art Styles',   anchor: 'art-styles' },
  { label: 'How It Works', anchor: 'how-it-works' },
  { label: 'Team',         anchor: 'team' },
  { label: 'FAQ',          anchor: 'faq' },
];

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const onHome = location.pathname === '/';

  const scrollTo = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const goTo = (anchor: string) => {
    setMobileOpen(false);
    if (onHome) {
      setTimeout(() => scrollTo(anchor), 300);
    } else {
      navigate(`/?scroll=${anchor}`);
    }
  };

  const goOrder = () => {
    setMobileOpen(false);
    if (onHome) {
      setTimeout(() => scrollTo('order'), 300);
    } else {
      navigate('/?scroll=order');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderColor: '#F0F0F0' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')}
          style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.saffron, background: 'none', border: 'none', cursor: 'pointer' }}>
          protago
        </button>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ label, anchor }) => (
            <button key={anchor} onClick={() => goTo(anchor)}
              className="text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: C.gray, background: 'none', border: 'none', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
          <button onClick={goOrder}
            className="px-5 py-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: C.gradient, border: 'none', cursor: 'pointer' }}>
            Order Now
          </button>
        </nav>

        {/* Hamburger button */}
        <motion.button
          onClick={() => setMobileOpen(o => !o)}
          className="md:hidden flex items-center justify-center rounded-xl"
          style={{ width: 38, height: 38, background: mobileOpen ? '#F3F4F6' : 'none', border: 'none', cursor: 'pointer', color: C.navy }}
          whileTap={{ scale: 0.92 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={mobileOpen ? 'x' : 'menu'}
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              {mobileOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="md:hidden border-t" style={{ borderColor: '#F0F0F0', background: '#fff' }}>
            <div className="px-4 py-4 flex flex-col">
              {NAV_LINKS.map(({ label, anchor }, i) => (
                <motion.button key={anchor}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => goTo(anchor)}
                  className="py-4 font-semibold text-center w-full"
                  style={{ color: C.navy, background: 'none', border: 'none', borderBottom: '1px solid #F5F5F5', cursor: 'pointer', fontSize: 18 }}>
                  {label}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (NAV_LINKS.length) * 0.04 }}
                onClick={goOrder}
                className="mt-3 mb-1 py-3 rounded-2xl text-sm font-bold text-white text-center"
                style={{ background: C.gradient, border: 'none', cursor: 'pointer', fontSize: 18 }}>
                Order Now →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launch offer banner — scrolling marquee */}
      <div className="w-full overflow-hidden"
        style={{ background: C.navy, padding: '8px 0' }}>
        <motion.div
          className="flex items-center whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ x: { duration: 18, repeat: Infinity, ease: 'linear' } }}>
          {[0, 1].map(copy => (
            <span key={copy} className="flex items-center gap-6 px-6" style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
              <span>🎉</span>
              <span>Launch Offer — <span style={{ color: '#F7B731' }}>15% OFF</span> with code <span className="font-extrabold tracking-wider" style={{ color: '#F7B731' }}>PROTAGO50</span></span>
              <span>🎊</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>✦</span>
              <span>🎉</span>
              <span>Launch Offer — <span style={{ color: '#F7B731' }}>15% OFF</span> with code <span className="font-extrabold tracking-wider" style={{ color: '#F7B731' }}>PROTAGO50</span></span>
              <span>🎊</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>✦</span>
            </span>
          ))}
        </motion.div>
      </div>
    </header>
  );
}
