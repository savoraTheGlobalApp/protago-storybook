import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const C = {
  saffron: '#FF6B35', gray: '#555555', lgray: '#999999',
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
    const top = el.getBoundingClientRect().top + window.scrollY - 64;
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
          <button onClick={() => navigate('/themes')}
            className="text-sm font-semibold transition-colors hover:opacity-70"
            style={{ color: location.pathname === '/themes' ? C.saffron : C.gray, background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: location.pathname === '/themes' ? 800 : 600 }}>
            Themes
          </button>
          <button onClick={goOrder}
            className="px-5 py-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: C.gradient, border: 'none', cursor: 'pointer' }}>
            Order Now
          </button>
        </nav>

        <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2"
          style={{ color: C.gray, background: 'none', border: 'none', cursor: 'pointer' }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden border-t" style={{ borderColor: '#F0F0F0' }}>
            <div className="px-5 py-4 flex flex-col gap-3 bg-white">
              {NAV_LINKS.map(({ label, anchor }) => (
                <button key={anchor} onClick={() => goTo(anchor)}
                  className="text-sm text-left py-1 font-semibold"
                  style={{ color: C.gray, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
              <button onClick={() => { setMobileOpen(false); navigate('/themes'); }}
                className="text-sm text-left py-1 font-semibold"
                style={{ color: C.saffron, background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: location.pathname === '/themes' ? 800 : 600 }}>
                Themes
              </button>
              <button onClick={goOrder}
                className="mt-1 px-5 py-2.5 rounded-full text-sm font-bold text-white text-center"
                style={{ background: C.gradient, border: 'none', cursor: 'pointer' }}>
                Order Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
