import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { About } from '../components/About';
import { Vision } from '../components/Vision';
import { Product } from '../components/Product';
import { BlogPreview } from '../components/BlogPreview';
import { Waitlist } from '../components/Waitlist';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

export function Home() {
    const location = useLocation();

    useEffect(() => {
        // Handle hash navigation (e.g., /#waitlist)
        if (location.hash === '#waitlist') {
            const scrollToWaitlist = () => {
                const waitlistElement = document.getElementById('waitlist');
                if (waitlistElement) {
                    const navHeight = 80;
                    const elementPosition = waitlistElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navHeight;

                    window.scrollTo({
                        top: Math.max(0, offsetPosition),
                        behavior: 'smooth'
                    });
                }
            };

            // Small delay to ensure page is rendered
            const timer = setTimeout(scrollToWaitlist, 100);
            return () => clearTimeout(timer);
        }
    }, [location.hash]);

    return (
        <div className="min-h-screen bg-white">
            <Navigation />
            <Hero />
            <Vision />
            <Product />
            <About />
            <BlogPreview />
            <Waitlist />
            <Footer />
        </div>
    );
}
