import { Sparkles, BookOpen, Brain, GamepadIcon, Users, Shield, School } from 'lucide-react';

export function Product() {
  const features = [
    {
      icon: Sparkles,
      title: 'Curiosity Companion',
      description: 'Engages naturally, encouraging questions and exploration'
    },
    {
      icon: GamepadIcon,
      title: 'Playful Learning',
      description: 'Interactive games, storytelling, and fun activities'
    },
    {
      icon: Brain,
      title: 'Guided Problem Solving',
      description: 'Help by guiding through problems rather than giving direct answers'
    }
  ];

  const parentFeatures = [
    {
      title: 'Development Insights',
      description: "Track your child's interests and learning progress"
    },
    {
      title: 'Quality Time Ideas',
      description: 'Personalized suggestions for parent-child activities'
    },
    {
      title: 'Stronger Bonds',
      description: 'Enhance connection through shared learning'
    },
    {
      title: 'Safety First',
      description: 'Monitor conversations and intervene when needed'
    }
  ];

  return (
    <section id="product" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


        {/* How Kitty Helps */}
        <div id="how-kitty-helps" className="mb-20 scroll-mt-20">
          <h3 className="text-4xl mb-10 text-center text-black">
            How Kitty Helps Children
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-gradient-to-br from-[#FFD93D]/10 to-[#FFD93D]/5 border-2 border-transparent hover:border-[#FFD93D] transition-all hover:shadow-xl text-center"
              >
                <div className="w-14 h-14 bg-[#FFD93D] rounded-xl flex items-center justify-center mb-5 mx-auto">
                  <feature.icon size={28} className="text-black" />
                </div>
                <h4 className="text-2xl mb-3 text-black">{feature.title}</h4>
                <p className="text-lg text-gray-700 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Solution Videos */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <div className="aspect-video bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-red-50 relative group w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/XhOmKpLV9rw?rel=0&modestbranding=1"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="aspect-video bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-red-50 relative group w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/JqAoSD_0STs?rel=0&modestbranding=1"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <p className="text-sm md:text-base text-gray-600 text-center mt-4">
                The software shown is our proprietary AI engine currently being tested in early hardware prototypes
              </p>
            </div>
          </div>
        </div>

        {/* Parent Features */}
        <div className="bg-black rounded-3xl p-10 md:p-14 text-white mb-20">
          <h3 className="text-4xl mb-10 text-center text-[#FFD93D]">
            How Kitty Helps Parents
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {parentFeatures.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-2 h-2 bg-[#FFD93D] rounded-full mt-2.5"></div>
                <div>
                  <h4 className="text-2xl mb-2 text-white">{feature.title}</h4>
                  <p className="text-lg text-white/80 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl mb-6 text-black">
            Meet Kitty
          </h2>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            A screen-free AI companion that grows, learns, and thinks with your child
          </p>
        </div> */}

        {/* Key Principles */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-10 rounded-3xl bg-gradient-to-br from-[#FFD93D] to-[#FFE873]">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield size={32} className="text-[#FFD93D]" />
            </div>
            <h4 className="text-2xl mb-4 text-black">Privacy First</h4>
            <p className="text-lg text-black/80 leading-relaxed">
              Security and privacy built from day one. Your family's data is protected.
            </p>
          </div>

          <div className="text-center p-10 rounded-3xl bg-gradient-to-br from-[#FFD93D] to-[#FFE873]">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles size={32} className="text-[#FFD93D]" />
            </div>
            <h4 className="text-2xl mb-4 text-black">Screen-Free</h4>
            <p className="text-lg text-black/80 leading-relaxed">
              No screens, no passive consumption. Natural interaction through voice.
            </p>
          </div>

          <div className="text-center p-10 rounded-3xl bg-gradient-to-br from-[#FFD93D] to-[#FFE873]">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <School size={32} className="text-[#FFD93D]" />
            </div>
            <h4 className="text-2xl mb-4 text-black">Expert-Backed</h4>
            <p className="text-lg text-black/80 leading-relaxed">
            Founded by doctors & engineers, with collaboration from Child Psychologists and Pedagogical experts ensuring optimal child development.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Lightbulb(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}
