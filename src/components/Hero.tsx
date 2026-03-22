import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function Hero() {

  const scrollToWaitlist = () => {
    const element = document.getElementById('waitlist');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFD93D] via-[#FFE873] to-[#FFF4B8]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-[#FFC93D]/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center md:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block px-5 py-2.5 bg-black/90 text-[#FFD93D] rounded-full mb-8 font-medium tracking-wide shadow-lg"
            >
              Reimagining Childhood Learning
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-6xl md:text-7xl lg:text-8xl mb-6 text-black font-bold tracking-tight"
            >
              Meet Kitty!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-2xl md:text-3xl text-black/80 mb-6 leading-relaxed max-w-lg mx-auto md:mx-0 font-medium"
            >
              Kitty: A screen-free voice AI companion for kids aged 4-10 years.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-lg text-black/60 mb-8"
            >
              Our innovative approach to child development blends technology and proven learning pedagogy, shaped by experts from <span className="text-black font-semibold">AIIMS Delhi</span> and <span className="text-black font-semibold">IIT Kanpur</span>.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <button
                onClick={scrollToWaitlist}
                className="px-8 py-4 bg-black text-[#FFD93D] rounded-full hover:bg-black/80 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 font-bold text-lg"
              >
                Join Waitlist
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('how-kitty-helps');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-8 py-4 bg-black text-[#FFD93D] rounded-full hover:bg-black/80 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 font-bold text-lg"
              >
                Know More
              </button>
            </motion.div>
          </motion.div>

          {/* Right content - Video placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative">
              <div className="aspect-video bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-black/10 relative group">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/F28lZyda-MY?rel=0&modestbranding=1&autoplay=1&mute=1"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>

            </div>

            {/* Status Notice */}
            <div className="mt-16 p-5 bg-white border-2 border-[#FFD93D] rounded-3xl text-center relative z-10 shadow-lg">
              <p className="text-base text-black leading-relaxed">
                <span className="font-bold"></span> Our smart teddy shown in video is an early prototype.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

