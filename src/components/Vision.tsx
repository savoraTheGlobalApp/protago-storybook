import { AlertCircle, Target, Lightbulb, Shield } from 'lucide-react';

export function Vision() {
  const problems = [
    {
      title: 'High passive screen time',
      points: [
        'Social isolation and reduced quality time with family',
        'Active minds turning into passive consumers of content',
        'Rising mental health issues and anxiety among children'
      ],
      videoId: 'zIwLWfaAg-8'
    },
    {
      title: 'Cognitive Decline',
      points: [
        'Lack of curiosity and independent thinking',
        'Constant scrolling is shrinking attention spans',
        'Instant answers from AI stop kids from thinking deeply'
      ],
      videoId: '5fI3zz2cp3k'
    }
  ];

  return (
    <section id="vision" className="py-24 bg-gradient-to-br from-gray-50 to-[#FFD93D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl mb-6 text-black">
            Meet Kitty
          </h2>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            A screen-free voice AI companion that grows, learns, and thinks with your child
          </p>
        </div>

        {/* Problems & Solutions */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h3 className="text-4xl text-black mb-4">The Problem Today</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {problems.map((problem, index) => (
              <div
                key={index}
                className="p-8 md:p-10 bg-white rounded-2xl border-2 border-red-100 hover:border-red-300 hover:shadow-lg transition-all h-full"
              >
                <h4 className="text-2xl md:text-3xl mb-6 md:mb-8 text-red-600 text-center font-semibold">
                  {problem.title}
                </h4>
                <ul className="text-lg md:text-xl text-gray-700 leading-relaxed space-y-3 md:space-y-4 max-w-md mx-auto">
                  {problem.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start md:items-center justify-center gap-2">
                      <span className="flex-shrink-0 text-red-600 text-xl font-bold mt-0.5 md:mt-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
