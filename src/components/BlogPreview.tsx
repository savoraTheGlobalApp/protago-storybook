import { BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BlogPreview() {
    const navigate = useNavigate();

    return (
        <section id="blog" className="py-24 bg-gradient-to-br from-[#FFD93D]/5 to-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-5xl md:text-6xl mb-6 text-black">
                        Our Vision
                    </h2>
                    <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-12">
                        Reimagining how we interact with technology
                    </p>
                </div>
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <BookOpen size={40} className="text-black" />
                        <h2 className="text-5xl md:text-6xl text-black">
                            Our Manifesto
                        </h2>
                    </div>
                    <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                        Why we're building a better future for children
                    </p>
                </div>

                {/* Manifesto Preview */}
                <article className="bg-white rounded-3xl shadow-xl p-10 md:p-14 relative overflow-hidden">
                    <div className="prose prose-lg max-w-none mb-8">
                        <p className="text-xl text-gray-700 leading-relaxed">
                            We are living through a rapid technological shift. The last generation grew up with screens, but the coming generation will grow up with AI woven into the fabric of their lives. While technology connects us, it has also saturated our world with endless content.
                        </p>
                        <p className="text-xl text-gray-700 leading-relaxed mt-4">
                            The result? Increasing passive screen time is quietly eroding attention spans, social skills, and the fundamental abilities to read, write, and connect emotionally. This impact is most profound on growing children...
                        </p>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => navigate('/blog')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all transform hover:-translate-y-1"
                        >
                            Read Manifesto

                        </button>
                    </div>
                </article>
            </div>
        </section>
    );
}
