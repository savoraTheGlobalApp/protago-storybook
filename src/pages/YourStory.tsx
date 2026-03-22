import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles, Mail } from 'lucide-react';

/*
 * IMAGE REQUIREMENTS FOR YOUR STORY LANDING PAGE
 *
 * This page is designed to showcase Indian mythology and values.
 * Below are the image requirements to make it visually rich:
 *
 * 1. HERO SECTION BACKGROUND (Line ~70)
 *    - Ancient Indian manuscript/palm leaf texture
 *    - OR subtle mandala pattern overlay
 *    - Size: 1920x1080px, very low opacity (5-10%)
 *
 * 2. DECORATIVE CORNER ELEMENTS (Line ~82-90)
 *    - Traditional Indian borders or Om symbols
 *    - Lotus flowers
 *    - Size: 150-200px, 20% opacity
 *
 * 3. SANSKAAR SECTION ICON (Line ~175)
 *    - Small decorative icon (broken chain, wilting lotus for "loss")
 *    - OR traditional border design
 *    - Size: 60-80px
 *
 * 4. EPIC LESSONS - CHARACTER IMAGES (Line ~280)
 *    Each epic lesson card needs an illustration:
 *    - Mahabharata: Krishna & Arjuna on chariot, or Bhagavad Gita scene (250x250px)
 *    - Ramayana: Ram with bow, or Ram-Sita-Hanuman (250x250px)
 *    - Vedas: Ancient sage meditating, or Vedic fire ceremony (250x250px)
 *
 * 5. SATSANG SECTION IMAGES (Line ~315)
 *    - Parent-child reading together in traditional Indian setting
 *    - OR grandmother telling stories to children
 *    - Size: 400x300px for each card
 *
 * IMAGE STYLE GUIDELINES:
 * - Use traditional Indian art styles (Madhubani, Pattachitra, or modern illustrations)
 * - Warm color palette: oranges, reds, ambers, golds
 * - Avoid overly modern or Western styles
 * - Cultural authenticity is key
 *
 * RECOMMENDED SOURCES:
 * - Commission custom illustrations from Indian artists
 * - Use royalty-free Indian mythology art (check licenses)
 * - AI-generated images with Indian art style prompts
 */

export function YourStory() {
  const scrollToDownload = () => {
    const element = document.getElementById('download');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const epicLessons = [
    {
      epic: 'महाभारत',
      englishName: 'Mahabharata',
      lesson: 'धर्म (Dharma)',
      description: 'When Arjuna hesitated on the battlefield, Krishna revealed the Bhagavad Gita - teaching him about duty, righteousness, and the eternal soul. Today\'s children face their own battles: peer pressure, moral dilemmas, and questions about right and wrong.',
      missingValue: 'Understanding duty, making ethical choices in difficult situations'
    },
    {
      epic: 'रामायण',
      englishName: 'Ramayana',
      lesson: 'मर्यादा (Maryada)',
      description: 'Ram\'s unwavering commitment to truth and honor, even at great personal cost, exemplifies living with integrity. Sita\'s strength and Hanuman\'s devotion show the power of faith and loyalty.',
      missingValue: 'Keeping promises, respecting boundaries, staying true to one\'s word'
    },
    {
      epic: 'वेद (Vedas)',
      englishName: 'Vedic Wisdom',
      lesson: 'सत्य (Satya)',
      description: 'सत्यमेव जयते - Truth alone triumphs. The Vedas teach us that truth is the foundation of all virtues. In an age of instant gratification and shortcuts, this ancient wisdom guides children toward authentic living.',
      missingValue: 'Speaking truth, living authentically, being honest with oneself'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Standalone Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-900 to-red-900 border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen size={32} className="text-amber-400" />
              <div>
                <h1 className="text-2xl font-bold text-amber-100 font-sanskrit">Your Story</h1>
                <p className="text-xs text-orange-200">संस्कार की कहानियाँ</p>
              </div>
            </div>
            <button
              onClick={scrollToDownload}
              className="px-6 py-2 bg-amber-500 text-gray-900 rounded-full hover:bg-amber-400 transition-all font-bold text-sm"
            >
              Download App
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-900 via-red-800 to-amber-900">
        {/* Background decorative image - Suggested: Subtle temple/mandala pattern or ancient manuscript texture */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255, 200, 87, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 80% 80%, rgba(255, 138, 0, 0.3) 0%, transparent 50%)`
          }} />
          {/* TODO: Add background image here - suggestions:
              - Ancient Indian manuscript/palm leaf texture
              - Subtle mandala pattern
              - Temple wall carvings pattern
              Use: <img src="/path-to-bg-pattern.png" className="absolute inset-0 w-full h-full object-cover opacity-5" /> */}
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-20 right-8 opacity-20">
          {/* TODO: Add decorative element - suggestions:
              - Om symbol
              - Lotus flower
              - Traditional Indian border pattern
              Size: 150-200px */}
          <div className="w-32 h-32 border-4 border-amber-400 rounded-full"></div>
        </div>
        <div className="absolute bottom-20 left-8 opacity-20">
          <div className="w-32 h-32 border-4 border-amber-400 rounded-full"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 mt-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-block mb-8">
                <p className="text-amber-300 text-xl md:text-2xl font-sanskrit mb-2 tracking-wider">
                  यथा राजा तथा प्रजा
                </p>
                <p className="text-amber-200/80 text-sm md:text-base italic">
                  As the stories we tell, so becomes the soul
                </p>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl mb-8 text-amber-100 font-bold tracking-tight">
                Your Story
              </h1>

              <p className="text-2xl md:text-3xl text-orange-200 mb-6 leading-relaxed max-w-4xl mx-auto font-medium">
                Where Ancient Wisdom Meets Modern Childhood
              </p>

              <p className="text-xl text-orange-100/90 mb-12 max-w-3xl mx-auto leading-relaxed">
                In the Gurukuls of ancient Bharat, knowledge was passed through stories. Today, we revive this sacred tradition -
                bringing the timeless lessons of our Vedas, Puranas, and Epics to your child through AI-powered storytelling.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <button
                  onClick={scrollToDownload}
                  className="px-10 py-5 bg-amber-500 text-gray-900 rounded-full hover:bg-amber-400 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 font-bold text-xl shadow-xl"
                >
                  Begin the Journey
                  <ArrowRight size={24} />
                </button>
              </div>

              {/* Sanskrit Shlokas as decorative elements */}
              <div className="grid md:grid-cols-3 gap-6 mt-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="p-6 bg-white/5 backdrop-blur-sm border border-amber-500/30 rounded-2xl"
                >
                  <p className="text-amber-300 text-lg font-sanskrit mb-2">धर्म</p>
                  <p className="text-orange-100 text-sm">Righteousness & Duty</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="p-6 bg-white/5 backdrop-blur-sm border border-amber-500/30 rounded-2xl"
                >
                  <p className="text-amber-300 text-lg font-sanskrit mb-2">सत्य</p>
                  <p className="text-orange-100 text-sm">Truth & Authenticity</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="p-6 bg-white/5 backdrop-blur-sm border border-amber-500/30 rounded-2xl"
                >
                  <p className="text-amber-300 text-lg font-sanskrit mb-2">करुणा</p>
                  <p className="text-orange-100 text-sm">Compassion & Empathy</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Missing Sanskaar */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
          {/* TODO: Add image - ancient Indian manuscript or temple art */}
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            {/* TODO: Add small decorative image above title - suggestions:
                - Broken chain or wilting lotus (symbolizing loss)
                - Traditional border design
                Size: 60-80px */}
            <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-orange-400 rounded-full"></div>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              संस्कार की कमी
            </h2>
            <p className="text-2xl text-orange-800 mb-4">The Erosion of Our Cultural Soul</p>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              For 5,000 years, Bharatiya civilization flourished because each generation passed down eternal truths through stories.
              Grandparents told tales of Krishna's मक्खन चोरी to teach playfulness with dharma. Parents narrated the Ramayana
              to instill the value of keeping one's word. Every story was a seed of संस्कार.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-10 md:p-14 border-2 border-orange-200 shadow-xl mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">What We've Lost</h3>
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-3 h-3 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-2">धर्म (Dharma) - The compass of right action</p>
                    <p className="text-gray-700 leading-relaxed">
                      When did you last hear a child ask "Is this dharmic?" Today's generation lacks the moral framework
                      that guided Yudhishthira to choose truth over victory, that made Harishchandra give up his kingdom for his word.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-3 h-3 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-2">सत्य (Satya) - Living in truth</p>
                    <p className="text-gray-700 leading-relaxed">
                      In a world of filters and facades, children grow up performing for likes. They've never heard how
                      Prahlad's unwavering truth protected him, or how Gautam Buddha's honest inquiry led to enlightenment.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-3 h-3 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-2">सेवा (Seva) - Service before self</p>
                    <p className="text-gray-700 leading-relaxed">
                      Hanuman's devotion, Shabari's patience, Sudama's humility - these are not just stories, but blueprints
                      for living with grace. Without them, we raise a generation that knows only "What's in it for me?"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center bg-amber-50 rounded-2xl p-8 border border-amber-200">
              <p className="text-2xl text-gray-800 font-medium italic mb-4">
                "Children who don't know why Ram spent 14 years in exile, or why Krishna lifted Govardhan,
                grow up not knowing why we sacrifice for family, or stand up for the helpless."
              </p>
              <p className="text-gray-600">- The cost of cultural amnesia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Epic Lessons */}
      <section id="features" className="py-24 bg-gradient-to-br from-orange-900 via-red-900 to-amber-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-amber-100 mb-6">
              Timeless Wisdom from Our Epics
            </h2>
            <p className="text-xl text-orange-200 max-w-3xl mx-auto leading-relaxed">
              Every story from our sacred texts holds a mirror to modern life's challenges.
              Your Story brings these eternal truths to your child's world.
            </p>
          </div>

          <div className="space-y-8">
            {epicLessons.map((lesson, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-sm border-2 border-amber-500/30 rounded-3xl p-8 md:p-12 hover:bg-white/15 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-shrink-0">
                    {/* TODO: Add character/scene image above the card - suggestions based on index:
                        0 (Mahabharata): Krishna and Arjuna on chariot, or Bhagavad Gita scene
                        1 (Ramayana): Ram with bow, or Ram-Sita-Hanuman, or Ram breaking Shiva's bow
                        2 (Vedas): Ancient sage meditating, or Vedic fire ceremony, or Om symbol with mandala
                        Size: 250x250px, rounded corners, positioned above or beside the card */}
                    <div className="bg-amber-500 text-gray-900 rounded-2xl p-6 text-center min-w-[180px] shadow-xl">
                      {/* Image placeholder */}
                      <div className="w-full h-32 bg-gradient-to-br from-orange-300 to-amber-200 rounded-xl mb-4 flex items-center justify-center">
                        <div className="text-6xl opacity-30">
                          {index === 0 && '🏹'} {/* Mahabharata - bow/arrow */}
                          {index === 1 && '🪷'} {/* Ramayana - lotus */}
                          {index === 2 && '🕉️'} {/* Vedas - Om */}
                        </div>
                      </div>
                      <p className="text-3xl font-bold font-sanskrit mb-2">{lesson.epic}</p>
                      <p className="text-sm opacity-80">{lesson.englishName}</p>
                      <div className="mt-4 pt-4 border-t border-gray-900/20">
                        <p className="text-xl font-bold font-sanskrit">{lesson.lesson}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xl text-orange-100 leading-relaxed mb-4">
                      {lesson.description}
                    </p>
                    <div className="bg-amber-500/20 rounded-xl p-4 border border-amber-500/30">
                      <p className="text-sm text-amber-200 font-semibold mb-1">What Today's Children Are Missing:</p>
                      <p className="text-amber-100">{lesson.missingValue}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block bg-white/10 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-8">
              <Sparkles className="mx-auto text-amber-300 mb-4" size={48} />
              <p className="text-2xl text-amber-100 font-medium mb-2">
                सा विद्या या विमुक्तये
              </p>
              <p className="text-orange-200 italic">
                That alone is knowledge which liberates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Satsang - Parent-Child Connection */}
      <section className="py-24 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              संगत का प्रभाव
            </h2>
            <p className="text-2xl text-orange-800 mb-6">The Power of Sacred Company</p>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              In our tradition, learning happened through satsang - sitting together in truth.
              Your Story recreates this sacred space between parent and child.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 shadow-xl border-2 border-orange-200 overflow-hidden"
            >
              {/* TODO: Add image - Parent and child sitting together listening to stories
                  OR grandmother telling stories to children in traditional Indian setting
                  Size: 400x250px, place at top of card or as background */}
              <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl mb-6 flex items-center justify-center border-2 border-orange-200">
                <div className="text-center text-gray-400">
                  <BookOpen size={48} className="mx-auto mb-2 text-orange-400" />
                  <p className="text-sm">Parent-child storytelling scene</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">कथा का समय (Story Time)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When your child asks "Why should I help that kid at school?" you can play the story of
                Karna's दान धर्म. When they struggle with honesty, listen together to young Chanakya
                choosing wisdom over wealth.
              </p>
              <p className="text-orange-800 font-medium">
                Every story becomes a conversation, every myth a life lesson.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 shadow-xl border-2 border-orange-200 overflow-hidden"
            >
              {/* TODO: Add image - Child with mobile device looking engaged/happy
                  OR child with traditional Indian values symbols (lotus, lamp, books)
                  Size: 400x250px, place at top of card */}
              <div className="w-full h-48 bg-gradient-to-br from-amber-100 to-yellow-50 rounded-2xl mb-6 flex items-center justify-center border-2 border-amber-200">
                <div className="text-center text-gray-400">
                  <Sparkles size={48} className="mx-auto mb-2 text-amber-500" />
                  <p className="text-sm">Child learning values scene</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">संस्कार की नींव (Seeds of Sanskaar)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You're not just downloading an app - you're becoming your child's first guru. Track which
                values resonate, which characters inspire them. Watch as Abhimanyu's courage or
                Draupadi's dignity slowly shapes their character.
              </p>
              <p className="text-orange-800 font-medium">
                Plant these seeds young, and watch dharma bloom.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12 max-w-3xl mx-auto bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl p-10 border-2 border-orange-300 text-center"
          >
            <p className="text-2xl text-gray-800 font-medium mb-4 leading-relaxed">
              "मातृ देवो भव, पितृ देवो भव"
            </p>
            <p className="text-lg text-gray-700 italic mb-2">
              Let mother and father be thy God
            </p>
            <p className="text-gray-600 mt-4">
              Your voice telling these stories will be the compass your child carries for life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Download CTA - Become Part of the Revival */}
      <section id="download" className="py-24 bg-gradient-to-br from-orange-900 via-red-900 to-amber-900 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <p className="text-amber-300 text-2xl md:text-3xl font-sanskrit mb-3">
                यत्र नार्यस्तु पूज्यन्ते रमन्ते तत्र देवताः
              </p>
              <p className="text-orange-200 text-lg italic">
                Where children are nurtured with wisdom, divinity dwells
              </p>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-amber-100 mb-6">
              Join the Sanskaar Revival
            </h2>
            <p className="text-xl text-orange-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              For too long, we've let our children grow up disconnected from the wisdom that made
              Bharat a vishwaguru. It's time to reclaim our heritage - one story at a time.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
              <a
                href="#"
                className="px-10 py-5 bg-amber-500 text-gray-900 rounded-full hover:bg-amber-400 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 font-bold text-xl shadow-xl"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 2H6.477C4.835 2 3.5 3.335 3.5 4.977v14.046C3.5 20.665 4.835 22 6.477 22h11.046c1.642 0 2.977-1.335 2.977-2.977V4.977C20.5 3.335 19.165 2 17.523 2zM12 19.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm5-4.5H7V5h10v10z"/>
                </svg>
                Download for Android
                <ArrowRight size={24} />
              </a>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-8 max-w-2xl mx-auto">
              <p className="text-amber-100 text-lg mb-3">
                Free access to 100+ stories from Mahabharata, Ramayana, Puranas, and Vedic tales
              </p>
              <p className="text-orange-200/80">
                Start your child's journey into dharma, satya, and seva today
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen size={48} className="mx-auto text-orange-600 mb-6" />
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Questions About Your Story?
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            We're here to help you bring ancient wisdom to your family
          </p>
          <a
            href="mailto:hello@icurious.ai"
            className="text-2xl text-orange-600 hover:underline transition-all font-semibold"
          >
            hello@icurious.ai
          </a>
        </div>
      </section>

      {/* Standalone Footer */}
      <footer className="bg-gradient-to-r from-orange-900 to-red-900 border-t-4 border-amber-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen size={32} className="text-amber-400" />
              <div>
                <h2 className="text-2xl font-bold text-amber-100 font-sanskrit">Your Story</h2>
                <p className="text-sm text-orange-200">AI-Powered Storytelling for Indian Families</p>
              </div>
            </div>
            <p className="text-orange-200 mb-4">
              Reviving the ancient tradition of storytelling for modern Indian families
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-300">
              <Mail size={18} />
              <a href="mailto:hello@icurious.ai" className="hover:text-amber-200 transition-colors">
                hello@icurious.ai
              </a>
            </div>
            <p className="text-orange-300 text-sm mt-6">
              © 2025 Your Story. Built with love for Bharatiya Sanskaar.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
