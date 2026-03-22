import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import kittyIcon from '../assets/kitty.png';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > window.innerHeight - 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (item: string) => {
    if (item === 'Blog') {
      navigate('/blog');
      setIsMobileMenuOpen(false);
    } else if (item === 'Vision') {
      scrollToSection('blog');
    } else if (item === 'Product') {
      scrollToSection('vision');
    } else if (item === 'Home') {
      if (location.pathname !== '/') {
        navigate('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setIsMobileMenuOpen(false);
    } else {
      scrollToSection(item.toLowerCase());
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white shadow-sm border-b border-black/5'
        : 'bg-[#FFD93D] shadow-sm'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={kittyIcon} alt="Kitty" style={{ height: '2.5rem', width: '2.5rem' }} className="rounded-full object-cover shadow-sm" />
            <span className={`text-3xl tracking-wide transition-colors font-bold ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}>
              iCurious AI
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Product', 'Team', 'Vision', 'Blog'].map((item) => (
              <button
                key={item}
                onClick={() => handleNavigation(item)}
                className="text-gray-700 hover:text-black font-medium transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FFD93D] transition-all group-hover:w-full" />
              </button>
            ))}
            <button
              onClick={() => scrollToSection('waitlist')}
              className="px-6 py-2.5 bg-black text-white rounded-full font-medium hover:bg-gray-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Join Waitlist
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-800"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '45vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-xl overflow-y-auto"
          >
            <div className="px-4 py-8 pb-32 space-y-2 flex flex-col items-center">
              {['Home', 'Product', 'Team', 'Vision', 'Blog'].map((item) => (
                <button
                  key={item}
                  onClick={() => handleNavigation(item)}
                  className="block w-full max-w-sm text-center text-lg font-medium text-gray-800 hover:text-[#FFD93D] hover:bg-[#FFD93D]/10 py-4 px-6 rounded-xl transition-all duration-200 border-b border-gray-100 last:border-b-0"
                >
                  {item}
                </button>
              ))}
              <div className="w-full max-w-sm pt-4">
                <button
                  onClick={() => scrollToSection('waitlist')}
                  className="block w-full px-6 py-4 bg-black text-white rounded-full text-center font-medium hover:bg-gray-800 hover:shadow-lg transition-all transform hover:scale-105"
                >
                  Join Waitlist
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
