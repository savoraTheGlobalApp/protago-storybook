import { Linkedin, Twitter } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import RajanPhoto from '../assets/Rajan_photograph.jpg';
import ShoryaPhoto from '../assets/Shorya_photo.jpg';
import PiyushPhoto from '../assets/Piyush_photo2.jpeg';

export function About() {
  const founders = [
    {
      name: 'Dr. Rajan Kumar',
      role: 'Co-Founder & CEO',
      education: 'MBBS, AIIMS Delhi',
      image: RajanPhoto,
      linkedin: 'https://www.linkedin.com/in/rajan3473p/',
      twitter: 'https://x.com/iCuriousRajan'
    },
    {
      name: 'Shorya Kumar',
      role: 'Co-Founder & CTO',
      education: 'B.Tech, IIT Kanpur',
      image: ShoryaPhoto,
      linkedin: 'https://www.linkedin.com/in/shoryak/',
      twitter: 'https://x.com/meet_shoryak'
    },
    {
      name: 'Piyush Kumar',
      role: 'Co-Founder & CPO',
      education: 'B.Tech, IIT Kanpur',
      image: PiyushPhoto,
      linkedin: 'https://linkedin.com/in/kpiyush25',
      twitter: 'https://x.com/PiyushKThisSide/'
    }
  ];

  return (
    <section id="team" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl mb-6 text-black">
            Mission-Driven Team
          </h2>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Designed by alums from <span className="text-black font-semibold">AIIMS Delhi</span> and <span className="text-black font-semibold">IIT Kanpur</span>
          </p>
        </div>

        {/* Founders */}
        <div className="mb-20">
          <h3 className="text-3xl mb-10 text-center text-black">Meet Our Founders</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {founders.map((founder, index) => (
              <div
                key={index}
                className="text-center group"
              >
                <div className="mb-6 overflow-hidden rounded-2xl">
                  <ImageWithFallback
                    src={founder.image}
                    alt={founder.name}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                    style={
                      founder.name === 'Piyush Kumar'
                        ? { objectPosition: 'center 20%' }
                        : undefined
                    }
                  />
                </div>
                <h4 className="text-2xl mb-2 text-black">{founder.name}</h4>
                <p className="text-lg text-gray-600 mb-1">{founder.role}</p>
                <p className="text-base text-gray-500 mb-4">{founder.education}</p>
                <div className="flex justify-center gap-4">
                  <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0077b5] transition-colors">
                    <Linkedin size={20} />
                  </a>
                  <a href={founder.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
                    <Twitter size={20} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
