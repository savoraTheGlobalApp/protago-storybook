import { Twitter, Linkedin, Instagram, Youtube } from 'lucide-react';
import kittyIcon from 'figma:asset/kitty.png';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2 text-center md:text-left">
            <div className="mb-6 flex items-center gap-3 justify-center md:justify-start">
              <img src={kittyIcon} alt="Kitty" className="h-12 w-12" />
              <span className="text-2xl text-white">iCurious AI</span>
            </div>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              Building screen-free voice AI companion that fosters curiosity, creativity, and critical thinking in children
            </p>
            <p className="text-base text-gray-400">
              Founded by alums from AIIMS Delhi and IIT Kanpur
            </p>
          </div>

          <div>
            <h4 className="text-xl mb-5 text-[#FFD93D] text-center md:text-left">Quick Links</h4>
            <ul className="space-y-3 text-lg text-gray-300 text-center md:text-left">
              <li>
                <a href="#home" className="hover:text-[#FFD93D] transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#FFD93D] transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#vision" className="hover:text-[#FFD93D] transition-colors">
                  Vision
                </a>
              </li>
              <li>
                <a href="#product" className="hover:text-[#FFD93D] transition-colors">
                  Product
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-[#FFD93D] transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#waitlist" className="hover:text-[#FFD93D] transition-colors">
                  Join Waitlist
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl mb-5 text-[#FFD93D] text-center md:text-left">Connect</h4>
            <ul className="space-y-3 text-lg text-gray-300 text-center md:text-left">
              <li>
                <a href="mailto:hello@icurious.ai" className="hover:text-[#FFD93D] transition-colors">
                  hello@icurious.ai
                </a>
              </li>
              <li className="flex gap-4 justify-center md:justify-start pt-2">
                <a href="https://x.com/iCuriousAI" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD93D] transition-colors">
                  <Twitter size={24} />
                </a>
                <a href="https://www.linkedin.com/company/icurious-ai/" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD93D] transition-colors">
                  <Linkedin size={24} />
                </a>
                <a href="https://www.instagram.com/iCuriousAI/" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD93D] transition-colors">
                  <Instagram size={24} />
                </a>
                <a href="https://www.youtube.com/@iCuriousAI" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD93D] transition-colors">
                  <Youtube size={24} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-10 text-center text-base text-gray-400">
          <p className="mb-2">© {currentYear} iCurious AI. All rights reserved.</p>
          <p>Building technology that empowers the next generation.</p>
        </div>
      </div>
    </footer>
  );
}
