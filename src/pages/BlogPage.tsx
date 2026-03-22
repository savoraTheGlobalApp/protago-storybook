import { Blog } from '../components/Blog';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useEffect } from 'react';

export function BlogPage() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Navigation />
            <div className="pt-20">
                <Blog />
            </div>
            <Footer />
        </div>
    );
}
