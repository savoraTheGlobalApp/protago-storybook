import { BookOpen } from 'lucide-react';

export function Blog() {
  return (
    <section id="blog" className="py-24 bg-gradient-to-br from-[#FFD93D]/5 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <BookOpen size={40} className="text-black" />
            <h2 className="text-5xl md:text-6xl text-black">
              Our Manifesto
            </h2>
          </div>
          <p className="text-2xl text-gray-700 leading-relaxed">
            Why we're building a better future for children
          </p>
        </div>

        {/* Manifesto Content */}
        <article className="bg-white rounded-3xl shadow-2xl p-10 md:p-16 lg:p-20">
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8 text-xl text-gray-700 leading-relaxed">
              <p>
                We are living through a rapid technological shift. The last generation grew up with screens, but the coming generation will grow up with AI woven into the fabric of their lives. While technology connects us, it has also saturated our world with endless content. The result? Increasing passive screen time is quietly eroding attention spans, social skills, and the fundamental abilities to read, write, and connect emotionally.
              </p>

              <p>
                This impact is most profound on growing children, whose brains are still developing. And now, we face a new challenge. With the rise of powerful AI, we are beginning to offload our thinking. Studies show that 80% of school-going children are already relying on AI tools for homework. If the distraction of screens wasn't enough, we now risk outsourcing our very cognitive growth.
              </p>

              <p>
                We have witnessed this crisis firsthand. Even in elite institutions like the IITs, we see students who have been mechanized for jobs rather than nurtured for innovation. The spark of curiosity is getting killed, replaced by a race for credentials. If the brightest minds are losing their passion for learning, what does that mean for the future?
              </p>

              <p className="text-2xl text-black font-medium">
                At iCurious, we asked ourselves: Can we build a future where technology empowers our children instead of stifling them?
              </p>

              <p>
                We believe the answer lies in reimagining how humans and technology interact. Our mission is to create smart AI companions that don't just provide answers, but foster curiosity. We are designing "peer learners"—companions that grow, learn, and think <em>with</em> the child. In the AI era, independent thinking and creativity will be the most vital skills, and our goal is to nurture them from day one.
              </p>

              <p>
                Imagine a world where every child has a dedicated mentor. AI has the potential to solve the scarcity of trained teachers and move beyond rote learning. By creating better interfaces and privacy-first companions, we can bring critical thinking and self-awareness back into everyday life.
              </p>

              <p>
                We are committed to building this future responsibly, with security and privacy at the core of everything we do. We believe that the best learning happens during play, which is why our first product is a smart toy designed to engage, mentor, and inspire.
              </p>

              <p className="text-2xl text-black font-bold">
                Join us on this journey to build a better future for our children.
              </p>
            </div>

            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <p className="text-base text-gray-500">— The iCurious Team</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
