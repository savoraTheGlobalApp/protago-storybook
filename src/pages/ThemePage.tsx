import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { THEMES } from '../data/themes';
import { getFaceSamples, getArrowTarget, THEME_FACE_SAMPLES } from '../data/themeMockups';
import { NavBar } from '../components/NavBar';
import { trackPreviewStarted } from '../utils/analytics';

const C = {
  saffron: '#FF6B35',
  gold:    '#F7B731',
  navy:    '#1A1A2E',
  white:   '#FFFFFF',
  gray:    '#555555',
  lgray:   '#999999',
};

const GCS_SAMPLE = 'https://storage.googleapis.com/protago-story-scenes/sample-pages';
const GCS_SCENES = 'https://storage.googleapis.com/protago-story-scenes';

type SamplePage = { imageUrl: string; title: string; text: string };

const SAMPLE_PAGES: Record<string, SamplePage[]> = {
  'abc': [
    { imageUrl: '/scenes/abc/scene_01.webp', title: 'A for Apple, B for Butterfly', text: 'The adventure begins! Your child reaches up to pick a bright red Apple from the tallest branch — "A!" A cheerful Butterfly lands right on their nose — "B!" Every letter is a new friend waiting to be discovered.' },
    { imageUrl: '/scenes/abc/scene_02.webp', title: 'C for Cat, D for Dragon', text: 'Under a glowing crescent moon, your child cuddles a purring Cat — "C!" Then — WHOOSH — a friendly Dragon appears, breathing tiny golden sparks — "D!" Learning letters feels like pure magic tonight.' },
    { imageUrl: '/scenes/abc/scene_03.webp', title: 'E for Elephant, F for Fish', text: 'A gentle Elephant squirts a fountain of water into the golden air — "E!" Beneath the surface, a flash of colour darts by — "F for Fish!" The world is full of letters hiding in the most wonderful places.' },
    { imageUrl: '/scenes/abc/scene_04.webp', title: 'G for Giraffe, H for Horse', text: 'On the wide open savanna, a tall Giraffe munches treetops — "G!" A magnificent white Horse rears up against the sunset — "H!" Your child is halfway through the alphabet — and the adventure is only getting bigger!' },
  ],
  'financial-literacy': [
    {
      imageUrl: `${GCS_SAMPLE}/financial-literacy/cover.png`,
      title: 'The Money Magic Mission',
      text: 'A glowing golden coin appears — and the doors of the Coin Kingdom swing open! Your child steps into a world where every adventure teaches a lesson about money. Earn it, save it, spend it wisely, give a little — and watch your future grow.',
    },
    {
      imageUrl: `${GCS_SAMPLE}/financial-literacy/scene_01.png`,
      title: 'What Is Money?',
      text: 'One morning, your child found some coins glittering in the sun. "What can I do with these?" they wondered. Money is something we use to buy things we need and want — it can be earned, saved, spent, or even given away. Every coin holds a tiny bit of possibility!',
    },
    {
      imageUrl: `${GCS_SAMPLE}/financial-literacy/scene_02.png`,
      title: 'Earning Money',
      text: 'In the Coin Kingdom, every coin has to be earned. Your child rolled up their sleeves and got to work — because money is earned through effort, skill, and creativity. Your talent + your effort = your earning power!',
    },
    {
      imageUrl: `${GCS_SAMPLE}/financial-literacy/scene_03.png`,
      title: 'Needs and Wants',
      text: 'Three glowing choices floated before your child: a school bag (a need), a toy (a want), a book (both!). Needs are things we must have — food, clothes, a home. Wants are things we\'d love but can live without. Smart spenders always take care of needs first.',
    },
    {
      imageUrl: `${GCS_SAMPLE}/financial-literacy/scene_04.png`,
      title: 'The Saving Jar',
      text: 'Your child dropped the first coin — clink! — into the jar. The savings bar on the wall glowed a little brighter. Saving means keeping some money instead of spending it all. The more you save, the closer you get to your big dream.',
    },
  ],
  'colours-shapes': [
    { imageUrl: `${GCS_SCENES}/colours-shapes/young_girl/scene_01_spread.png`, title: 'Rainbow Kingdom Quest', text: 'The world woke up grey — every colour had vanished overnight! A magical paintbrush flew to your child: "Only you can bring them back!" Red, blue, yellow — the three primary colours that make all the rest. The Rainbow Kingdom adventure begins!' },
    { imageUrl: `${GCS_SCENES}/colours-shapes/young_girl/scene_02_spread.png`, title: 'The Red Circle', text: 'Your child dipped the brush and painted a big red CIRCLE — WHOOSH! The sun blazed back into the sky, warm and golden and bright. Circles are the shape of the sun, the moon, wheels, and coins. "One colour saved!" — so many more to go!' },
    { imageUrl: `${GCS_SCENES}/colours-shapes/young_girl/scene_03_spread.png`, title: 'The Blue Square', text: 'A deep blue SQUARE appeared under your child\'s brush — FLASH! The sky filled with the most beautiful shade of blue. Squares make our windows, tiles, books, and building blocks. Your child laughed as blue butterflies burst free from the painting!' },
    { imageUrl: `${GCS_SCENES}/colours-shapes/young_girl/scene_04_spread.png`, title: 'The Rainbow Returns', text: 'Colour by colour, shape by shape — your child painted them all back. Green triangles brought forests. Yellow stars lit up the night. The Rainbow Kingdom sparkled more beautifully than ever before. "You brought us all home!"' },
    { imageUrl: `${GCS_SCENES}/colours-shapes/young_girl/scene_05_spread.png`, title: 'Every Colour, Every Shape', text: 'Knowing colours and shapes helps us see the magic in everything. From triangle rooftops to round wheels on the road — the world is a gallery waiting to be explored. Your child now holds the paintbrush of curiosity forever.' },
  ],
  'bedtime-routines': [
    { imageUrl: `${GCS_SCENES}/bedtime-routines/young_girl/scene_01_spread.png`, title: 'Bedtime Magic Mission', text: 'The stars were whispering... tonight felt different for your child. A tiny moon-fairy appeared: "The Dreamland gate will only open with the right bedtime steps!" A good bedtime routine is one of the greatest gifts for your body and mind.' },
    { imageUrl: `${GCS_SCENES}/bedtime-routines/young_girl/scene_02_spread.png`, title: 'Sparkling Smile', text: 'Your child brushed every single tooth — sparkle by sparkle. A warm glow spread with each careful stroke. Clean teeth protect us from pain and keep us healthy and bright. The first lock on the Dreamland gate clicked open with a smile!' },
    { imageUrl: `${GCS_SCENES}/bedtime-routines/young_girl/scene_03_spread.png`, title: 'Cozy Pajamas', text: 'Into cozy pajamas — and something magical wrapped around your child. The fairy sprinkled starlight across their favourite soft pillow. A calm bedtime signals your brain: "Rest is coming. Be at peace." Dreamland was almost within reach!' },
    { imageUrl: `${GCS_SCENES}/bedtime-routines/young_girl/scene_04_spread.png`, title: 'Sweet Dreams', text: 'Your child climbed into bed, took a deep breath, and closed their eyes. The Dreamland gate swung wide open — golden, glowing, and waiting. Sleep is not wasted time — it is the most important part of your day. The Bedtime Magic Mission is complete!' },
    { imageUrl: `${GCS_SCENES}/bedtime-routines/young_girl/scene_05_spread.png`, title: 'Rest & Grow', text: 'Children who sleep well are happier, stronger, and sharper thinkers. Every night your child follows their routine, they are building one of the most powerful habits of their life. Sleep is when we grow, heal, remember, and prepare for tomorrow.' },
  ],
  'numbers-maths': [
    { imageUrl: `${GCS_SCENES}/numbers-maths/young_girl/scene_01_spread.png`, title: 'The Number Kingdom', text: 'A tiny fairy burst from a book with urgent news: "The Number Kingdom is in trouble — and only your child can help!" Numbers are everywhere: in music, in cooking, in the stars above. They are the language the whole universe speaks without words.' },
    { imageUrl: `${GCS_SCENES}/numbers-maths/young_girl/scene_02_spread.png`, title: 'The Number Lock', text: 'A giant gate blocked the path — sealed with a number lock. Your child counted carefully: "Fourteen!" BOOM — the gate blew open in a shower of golden sparks! Counting builds the foundation for all maths that comes after. Every number you know is a key.' },
    { imageUrl: `${GCS_SCENES}/numbers-maths/young_girl/scene_03_spread.png`, title: 'Freeing the Numbers', text: 'Deep in the kingdom, number friends were trapped in cages. "Only the right answers can free us!" Addition, subtraction — the two great tools of every number hero. When we solve a problem, we train our minds to be brave and precise.' },
    { imageUrl: `${GCS_SCENES}/numbers-maths/young_girl/scene_04_spread.png`, title: 'The Final Answer', text: '"THIRTEEN!" — CRACK! The final cage shattered into light. The numbers danced freely, laughing and glowing. Every maths skill you learn is a superpower that lasts your whole life. Numbers help us build, create, earn, cook, and travel!' },
    { imageUrl: `${GCS_SCENES}/numbers-maths/young_girl/scene_05_spread.png`, title: 'The Number Hero', text: 'Your child waved as the Number Kingdom burst into colour once more. The Number Kingdom will never go dark again — not with your child as its hero. The skills built here in heart and mind will last a lifetime.' },
  ],
  'sharing-sorry': [
    { imageUrl: `${GCS_SCENES}/sharing-sorry/young_girl/scene_01_spread.png`, title: 'The Greatest Toy', text: 'Your child had the greatest toy in the whole wide world. It spun and glowed and made the most wonderful sounds imaginable. Some things are so special, sharing them feels really hard. But holding things tightly can sometimes make us feel more alone.' },
    { imageUrl: `${GCS_SCENES}/sharing-sorry/young_girl/scene_02_spread.png`, title: 'The Big Share', text: 'A friend arrived, eyes wide with wonder. "Could I try it? Just for one minute?" Sharing isn\'t losing — it\'s multiplying the joy between two people. The best moments in life are almost always better together. Your child slowly, carefully, held out the toy.' },
    { imageUrl: `${GCS_SCENES}/sharing-sorry/young_girl/scene_03_spread.png`, title: 'Oops!', text: 'Whoops! The toy slipped and tumbled to the floor with a crack. Your child\'s heart dropped. Accidents happen — that is part of being in the world with others. What matters most is not the thing lost, but what we do next.' },
    { imageUrl: `${GCS_SCENES}/sharing-sorry/young_girl/scene_04_spread.png`, title: 'The Magic Sorry', text: '"I\'m sorry," said your child softly — and a golden star appeared between them, warm and bright. Sorry is one of the most powerful and bravest words we can say. It repairs not the toy, but the bond between friends.' },
    { imageUrl: `${GCS_SCENES}/sharing-sorry/young_girl/scene_05_spread.png`, title: 'Friends Forever', text: 'Your child and their friend smiled at each other — closer than before. The best toy was the friendship itself. Sharing and saying sorry are two of the most important skills a child can learn. They are the building blocks of every great relationship.' },
  ],
  'first-day-school': [
    { imageUrl: `${GCS_SCENES}/first-day-school/young_girl/scene_01_spread.png`, title: 'My Amazing First Day', text: 'Your child packed a magic backpack — today was the most important day! Pencils, a lunchbox, and one very deep breath packed inside. The first day of school is a giant leap into a bigger, wider world. Every great adventure begins with a first step.' },
    { imageUrl: `${GCS_SCENES}/first-day-school/young_girl/scene_02_spread.png`, title: 'Through the Gate', text: 'The school gate was tall, and the path beyond it looked so long. But your child walked forward — one brave foot in front of the other. Courage is not the absence of fear; it is walking through it anyway. The world on the other side was wonderful.' },
    { imageUrl: `${GCS_SCENES}/first-day-school/young_girl/scene_03_spread.png`, title: 'A New World', text: 'So many new faces — every one of them feeling exactly the same inside. Your child found a seat and looked around the big, bright classroom. Learning happens when we are open, curious, and a little bit brave. School is where we discover what we love.' },
    { imageUrl: `${GCS_SCENES}/first-day-school/young_girl/scene_04_spread.png`, title: 'A Real Friend', text: 'By the end of the day, your child had found a real and true friend. They laughed, they shared, they promised to sit together tomorrow. Friendship is one of the most important things school will ever teach us.' },
    { imageUrl: `${GCS_SCENES}/first-day-school/young_girl/scene_05_spread.png`, title: 'I Can\'t Wait to Go Back!', text: 'Your child skipped home thinking: "I can\'t wait to go back!" The first day of school is not an ending — it is the beginning of the greatest learning adventure of your child\'s life. Every day holds something wonderful.' },
  ],
  'managing-emotions': [
    { imageUrl: `${GCS_SCENES}/managing-emotions/young_girl/scene_01_spread.png`, title: 'The Feelings Superpower', text: 'Something BIG was bubbling up inside your child — hot and fast and loud. Feelings are not problems. They are messages from the wisest part of us. Every emotion — even the scary ones — has something important to say.' },
    { imageUrl: `${GCS_SCENES}/managing-emotions/young_girl/scene_02_spread.png`, title: 'The Deep Breath', text: 'Your child breathed in deeply — one, two, three, four, five counts. The storm inside slowed down. The edges softened. Space appeared. Deep breathing sends a signal to your brain: "We are safe. Be calm." The big feeling began to settle.' },
    { imageUrl: `${GCS_SCENES}/managing-emotions/young_girl/scene_03_spread.png`, title: 'Name It to Tame It', text: 'Your child gave the feeling a name — and something amazing happened. It shrank into something they could hold. Naming an emotion is one of the most powerful tools in the world. "I feel angry." "I feel sad." Three words that heal.' },
    { imageUrl: `${GCS_SCENES}/managing-emotions/young_girl/scene_04_spread.png`, title: 'Choose Kindness', text: 'Your child chose kindness — one small, brave, deliberate choice. And like a switch flipped on — everything felt lighter, brighter, better. Our feelings are our superpower when we learn to understand and guide them.' },
    { imageUrl: `${GCS_SCENES}/managing-emotions/young_girl/scene_05_spread.png`, title: 'A Strong Heart', text: 'Children who know their emotions grow into strong, compassionate leaders. Every time your child pauses, breathes, and names what they feel — they are building emotional intelligence that will last their whole life. That is the greatest superpower of all.' },
  ],
  'indian-festivals': [
    { imageUrl: `${GCS_SCENES}/indian-festivals/young_girl/scene_01_spread.png`, title: 'Festival of Wonder', text: 'The night sky glowed with a thousand tiny lights — it was time! Your child\'s home smelled of marigolds, sweets, and something magical. India\'s festivals are among the most vibrant celebrations on Earth. Each one carries a story of good over evil, light over darkness.' },
    { imageUrl: `${GCS_SCENES}/indian-festivals/young_girl/scene_02_spread.png`, title: 'The First Diya', text: 'Your child lit the first diya — and WHOOSH! Light danced everywhere. One little flame, reflected in a hundred oil lamps all around. Diyas have been lit in India for thousands of years. Light is a symbol of hope, knowledge, and the warmth we share.' },
    { imageUrl: `${GCS_SCENES}/indian-festivals/young_girl/scene_03_spread.png`, title: 'Holi!', text: 'Colours exploded as your child threw the biggest, brightest handful! Pink! Orange! Green! Purple! The air turned into a rainbow of joy. Holi celebrates the victory of goodness and the arrival of spring. Playing with colour together breaks every barrier between people.' },
    { imageUrl: `${GCS_SCENES}/indian-festivals/young_girl/scene_04_spread.png`, title: 'Dance and Celebrate', text: 'Your child danced and twirled — and the whole street joined in! Drums, music, laughter, and the scent of sweet festival food everywhere. India\'s festivals teach us that joy is always better when it is shared.' },
    { imageUrl: `${GCS_SCENES}/indian-festivals/young_girl/scene_05_spread.png`, title: 'This Is Home', text: 'Your child spun under the lights, heart full: "This is who I am. This is home." Every festival your child celebrates is a thread connecting them to a culture thousands of years old. Carry these stories forward, always.' },
  ],
  'history-india': [
    { imageUrl: `${GCS_SCENES}/history-india/young_girl/scene_01_spread.png`, title: 'India\'s Greatest Adventure', text: 'Your child opened an ancient map in the museum — and it began to glow. The seal of a great empire shimmered beneath their fingertips. India is one of the oldest civilisations in the history of the world. From the Indus Valley to the Mughal courts — thousands of years of story.' },
    { imageUrl: `${GCS_SCENES}/history-india/young_girl/scene_02_spread.png`, title: 'Chosen by History', text: '"You are chosen," the map declared, glowing bright and golden. India gave the world mathematics, chess, surgery, and the number zero. Our history is not just dates and kings — it is the story of human genius. Your child stepped forward: "Show me everything."' },
    { imageUrl: `${GCS_SCENES}/history-india/young_girl/scene_03_spread.png`, title: 'The Ancient Kingdom', text: 'Your child stood at the gates of a mighty, ancient kingdom. Warriors, scholars, traders, and artists bustled all around. Great empires like the Maurya, the Gupta, and the Maratha shaped our world. Their ideas still live in us today.' },
    { imageUrl: `${GCS_SCENES}/history-india/young_girl/scene_04_spread.png`, title: 'The Ancient Secret', text: 'Deep in the palace, your child discovered a scroll — the earliest writing of a great idea the world still uses today. India\'s greatest gift was the spirit of questioning and curiosity. Knowing where we come from makes us braver about where we are going.' },
    { imageUrl: `${GCS_SCENES}/history-india/young_girl/scene_05_spread.png`, title: 'Carry It Forward', text: 'Your child rolled the scroll carefully: "I will carry this story forward." Every child who learns India\'s history becomes a keeper of something precious. The civilisation that gave the world its numbers, its philosophy, and its poetry lives on — in your child.' },
  ],
  'growth-mindset': [
    { imageUrl: `${GCS_SCENES}/growth-mindset/young_girl/scene_01_spread.png`, title: 'The \'I Can\' Superpower', text: 'Your child stood at the foot of a mountain that looked truly impossible. Clouds swirled at the top. The path disappeared into the mist. A growth mindset means believing your abilities can always improve. The most successful people were beginners once, just like your child.' },
    { imageUrl: `${GCS_SCENES}/growth-mindset/young_girl/scene_02_spread.png`, title: 'The Magic Word: YET', text: 'A tiny voice in your child\'s chest said just one word: "Yet." Not "I can\'t climb it." But "I can\'t climb it — yet." The word "yet" turns every wall into a door and every failure into a lesson. Your child took the first step. Then another. Then another.' },
    { imageUrl: `${GCS_SCENES}/growth-mindset/young_girl/scene_03_spread.png`, title: 'Fall Down, Get Up', text: 'Your child fell. Got up. Fell again. Got up again — every single time. Struggling is not a sign that something is wrong. It is a sign of growth. Every time you push through difficulty, your brain actually gets stronger.' },
    { imageUrl: `${GCS_SCENES}/growth-mindset/young_girl/scene_04_spread.png`, title: 'The Top of the Mountain', text: 'Your child reached the top — and the whole world cheered below! The view was more magnificent than anything they had ever imagined. The most meaningful achievements are always the hardest-won ones. A growth mindset is not a talent — it is a decision made every day.' },
    { imageUrl: `${GCS_SCENES}/growth-mindset/young_girl/scene_05_spread.png`, title: 'I Believed I Could', text: 'Your child raised both arms and shouted: "I believed I could — and I did!" With a growth mindset, every summit is reachable. Every challenge your child faces from this day forward is just another mountain. The only real limit is the one you place on yourself.' },
  ],
  'professions': [
    { imageUrl: `${GCS_SCENES}/professions/young_girl/scene_01_spread.png`, title: 'Dream Big', text: 'Your child floated completely weightless — the Earth glowing far below. Stars stretched out in every direction: quiet, endless, and magnificent. Astronauts train for years to explore the final frontier of human knowledge. The world below is full of people your child might one day serve.' },
    { imageUrl: `${GCS_SCENES}/professions/young_girl/scene_02_spread.png`, title: 'The Healer', text: '"Are you okay?" your child asked, checking each patient with the greatest care. Every diagnosis was a puzzle. Every recovery was a reason to celebrate. Doctors combine deep knowledge with deep compassion every single day. Medicine is one of the most honoured callings in human history.' },
    { imageUrl: `${GCS_SCENES}/professions/young_girl/scene_03_spread.png`, title: 'The Builder', text: 'Your child pointed to the blueprints: "We build it here." Bridges, hospitals, schools, rockets — engineers bring imagination to life. Engineering is applied problem-solving at the grandest possible scale. The buildings of tomorrow are being dreamed up by children today.' },
    { imageUrl: `${GCS_SCENES}/professions/young_girl/scene_04_spread.png`, title: 'The Pilot', text: 'Your child gripped the controls — and the whole vast sky was theirs to explore. Below: cities, rivers, mountains, and oceans passing in a breathtaking blur. Every profession is a way of serving the world with your unique gifts and talents.' },
    { imageUrl: `${GCS_SCENES}/professions/young_girl/scene_05_spread.png`, title: 'Whatever You Become', text: 'Your child set the course ahead: "Whatever I become — I will give it everything." The world needs doctors, engineers, pilots, teachers, artists, and dreamers. Every profession your child can imagine is a path waiting to be walked. Dream big — then work with everything you have.' },
  ],
  'internet-safety': [
    { imageUrl: `${GCS_SCENES}/internet-safety/older_girl/scene_01_spread.png`, title: 'Safe in the Digital World', text: 'The internet is an incredible place — full of learning and fun. But everything you do online is real, just like the real world. Real people are on the other side of every screen. Real feelings get hurt. Real words leave real marks. Use the digital world with care.' },
    { imageUrl: `${GCS_SCENES}/internet-safety/older_girl/scene_02_spread.png`, title: 'Your Digital Lock', text: 'Your password is the lock on your digital front door. A strong password is long, mixed, and known only to you. Never share your password — not with friends, not with anyone. Use different passwords for different accounts. A strong lock keeps your world safe.' },
    { imageUrl: `${GCS_SCENES}/internet-safety/older_girl/scene_03_spread.png`, title: 'Online Friends', text: 'It is wonderful to connect with people online. But online friends are different from the friends you can see and touch. Someone online may not be who they say they are. Never share your address, school, or phone number online.' },
    { imageUrl: `${GCS_SCENES}/internet-safety/older_girl/scene_04_spread.png`, title: 'Think Before You Post', text: 'Before you post, pause and ask yourself: Is it true? Is it kind? Would I be happy if everyone saw it? Once something is posted, it can travel far and fast. Even deleted posts can leave a trace. Think first. Your words and images are yours — protect them.' },
    { imageUrl: `${GCS_SCENES}/internet-safety/older_girl/scene_05_spread.png`, title: 'A Safe Digital Hero', text: 'Your child now knows how to explore the digital world with wisdom, courage, and care. Stay curious, stay kind, stay safe. The internet is a powerful tool — and your child holds the power. The digital world is better because your child is in it.' },
  ],
  'body-safety': [
    { imageUrl: `${GCS_SCENES}/body-safety/older_girl/scene_01_spread.png`, title: 'My Body Belongs to Me', text: 'From the top of your head to the tips of your toes — every single part of your body belongs to YOU. No one else. Just you. Your body is your home, and you are the only one in charge. That is your superpower.' },
    { imageUrl: `${GCS_SCENES}/body-safety/older_girl/scene_02_spread.png`, title: 'Safe Touches', text: 'Some touches feel warm and safe — a hug from family, a doctor\'s check-up with a parent nearby. Some touches feel wrong, confusing, or uncomfortable. If a touch feels wrong — even from someone you know — it is always okay to tell a trusted adult. Always.' },
    { imageUrl: `${GCS_SCENES}/body-safety/older_girl/scene_03_spread.png`, title: 'Private Means Private', text: 'The parts covered by your swimsuit are your private parts. They belong only to you — no one should touch them or ask to see them, except a doctor with your parent present. Private means private. Your boundaries are real and they matter.' },
    { imageUrl: `${GCS_SCENES}/body-safety/older_girl/scene_04_spread.png`, title: 'The Power of NO', text: '"NO" is one of the most powerful words you know. You can say it to anyone — even a grown-up, even someone you love — if something about your body doesn\'t feel right. You never have to hug, kiss, or be touched if you don\'t want to. NO is a complete sentence.' },
    { imageUrl: `${GCS_SCENES}/body-safety/older_girl/scene_05_spread.png`, title: 'You Are Strong', text: 'Your child now knows that their body belongs to them — and that speaking up is always the right thing to do. Body safety is not just a lesson. It is a shield. A child who knows their rights is a child who is protected. You are strong, brave, and loved.' },
  ],
  'potty-training': [
    { imageUrl: '/themes_scenes/potty-training/scene_01.webp', title: 'The Big Milestone!', text: 'Something exciting is happening — your child is growing up! Big kids use the potty, and today the adventure begins. Every hero has a first step. This is yours.' },
    { imageUrl: '/themes_scenes/potty-training/scene_03.webp', title: 'I Did It!', text: 'Your child sat down, took a deep breath — and the magic happened! A happy dance, a huge smile, and the proudest feeling in the world. "I did it!" is one of the most powerful things a child can say.' },
    { imageUrl: '/themes_scenes/potty-training/scene_05.webp', title: 'Wash Those Hands!', text: 'Splash, splash, scrub, scrub — clean hands are superhero hands! Washing hands after the potty keeps germs away and bodies healthy. Your child is learning one of the most important habits of their life.' },
    { imageUrl: '/themes_scenes/potty-training/scene_07.webp', title: 'Getting Braver', text: 'Every day your child gets a little braver, a little more confident. Accidents happen — and that is perfectly okay. What matters is trying. The potty knows your child is on the way to becoming a pro!' },
    { imageUrl: '/themes_scenes/potty-training/scene_09.webp', title: 'Potty Hero!', text: 'Your child stands tall — a true Potty Hero! This milestone means independence, growth, and pride. The whole family is cheering. Growing up is the greatest adventure of all.' },
  ],
  'pet-buddy': [
    { imageUrl: '/pet-theme/cover.webp',                         title: 'My Pet & Me', text: 'Every morning your child wakes up to the most excited face in the world — their furry best friend! This is the story of a child and their pet going through every moment of the day together.' },
    { imageUrl: '/pet-theme/scene_01_good_morning_bhaiya.webp',  title: 'Good Morning!', text: 'Tiny paws and happy barks — your child and their pet greet the morning together. The day always feels brighter when your best friend is there to welcome it with you.' },
    { imageUrl: '/pet-theme/scene_02_breakfast_race.webp',       title: 'Breakfast Race', text: 'Who finishes breakfast first — your child or their pet? The great breakfast race is on! Learning to share mealtimes builds a bond that lasts a lifetime.' },
    { imageUrl: '/pet-theme/scene_03_garden_run.webp',           title: 'Garden Run', text: 'Out into the garden — running, leaping, and chasing each other through the grass! Exercise is always more fun when you have a furry companion to share it with.' },
    { imageUrl: '/pet-theme/scene_04_the_ball.webp',             title: 'The Ball', text: 'One ball, two players — and the best game in the world! Fetch, throw, catch — your child and their pet discover that joy is always multiplied when you share it.' },
  ],
  'hindi-alphabet': [
    { imageUrl: '/themes_scenes/hindi-alphabet/scene_01.webp', title: 'अ से आम — A for Aam', text: 'Your child reaches for a golden mango hanging from the tallest branch — "अ!" The Hindi alphabet begins with the sweetest letter of all. Every language is a treasure, and Hindi is one of the oldest in the world.' },
    { imageUrl: '/themes_scenes/hindi-alphabet/scene_03.webp', title: 'इ से इमली — I for Imli', text: 'A twisty tamarind tree sways gently in the warm breeze — "इ!" Your child traces the letter in the air. Each Hindi akshar is a little piece of art — curved, flowing, and full of life.' },
    { imageUrl: '/themes_scenes/hindi-alphabet/scene_05.webp', title: 'उ से उल्लू — U for Ullu', text: 'A wise owl blinks from its perch under the moon — "उ!" In Hindi, every vowel has its own unique sound that unlocks hundreds of beautiful words. Your child is discovering a whole new world.' },
    { imageUrl: '/themes_scenes/hindi-alphabet/scene_07.webp', title: 'क से कमल — Ka for Kamal', text: 'A lotus blooms perfectly still on a shimmering pond — "क!" The consonants of Hindi are bold and bright. The lotus is India\'s national flower — and now your child can write its first letter!' },
    { imageUrl: '/themes_scenes/hindi-alphabet/scene_09.webp', title: 'ग से गाय — Ga for Gaay', text: 'A gentle cow with a golden bell wanders through a sunny field — "ग!" Hindi letters are not just sounds — they are stories. Every akshar your child learns is a new key to the language of home.' },
  ],
};

function SampleBookViewer({ slug, onGetPreview }: { slug: string; onGetPreview?: () => void }) {
  const pages = SAMPLE_PAGES[slug];
  if (!pages) return null;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const page = pages[idx];
  const isLast = idx === pages.length - 1;

  // Auto-rotate every 3.5 s; pause briefly after manual nav
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIdx(i => (i + 1) % pages.length), 3500);
    return () => clearInterval(id);
  }, [paused, pages.length]);

  const go = (next: number) => {
    setIdx(next);
    setPaused(true);
    setTimeout(() => setPaused(false), 6000);
  };

  return (
    <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 16, color: C.navy, margin: '0 0 14px' }}>
        📖 Read a few pages
      </h3>

      {/* Scene image with text overlay */}
      <div
        style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: '0 6px 28px rgba(0,0,0,0.18)', touchAction: 'pan-y', cursor: 'pointer' }}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx < -40 && idx < pages.length - 1) go(idx + 1);
          if (dx > 40 && idx > 0) go(idx - 1);
          touchStartX.current = null;
        }}
      >
        {/* Full scene image */}
        <img
          key={page.imageUrl}
          src={page.imageUrl}
          alt={page.title}
          style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
        />

        {/* Gradient + text overlay at bottom (desktop) */}
        <div className="book-page-overlay" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(10,10,30,0.93) 0%, rgba(10,10,30,0.72) 55%, transparent 100%)',
          padding: '28px 16px 16px',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.saffron, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5 }}>
            {idx === 0 ? 'Cover' : `Scene ${idx + 1} of ${pages.length}`}
          </div>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 6 }}>
            {page.title}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.88)', fontFamily: "'Nunito', sans-serif" }}>
            {page.text}
          </div>
        </div>

        {/* Side tap zones */}
        {idx > 0 && (
          <button onClick={() => go(idx - 1)}
            style={{ position: 'absolute', top: 0, left: 0, width: '20%', height: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }} />
        )}
        {!isLast && (
          <button onClick={() => go(idx + 1)}
            style={{ position: 'absolute', top: 0, right: 0, width: '20%', height: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }} />
        )}
      </div>

      {/* Text below image (mobile only) */}
      <div className="book-page-text-below" style={{ padding: '12px 4px 4px', minHeight: 180 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.saffron, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>
          {idx === 0 ? 'Cover' : `Scene ${idx + 1} of ${pages.length}`}
        </div>
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 15, color: C.navy, marginBottom: 6 }}>
          {page.title}
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.7, color: '#444', fontFamily: "'Nunito', sans-serif" }}>
          {page.text}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <button onClick={() => go(Math.max(0, idx - 1))} disabled={idx === 0}
          style={{ background: 'none', border: `1.5px solid ${idx === 0 ? '#D1D5DB' : C.saffron}`, borderRadius: '50%', width: 30, height: 30, cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#D1D5DB' : C.saffron, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
          ‹
        </button>
        <div style={{ display: 'flex', gap: 5 }}>
          {pages.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              style={{ width: 7, height: 7, borderRadius: '50%', border: 'none', background: i === idx ? C.saffron : '#D1D5DB', cursor: 'pointer', padding: 0, transition: 'background 0.2s' }} />
          ))}
        </div>
        {isLast && onGetPreview ? (
          <button onClick={onGetPreview}
            style={{ background: `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`, color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: '0 3px 10px rgba(255,107,53,0.4)', whiteSpace: 'nowrap' }}>
            Get Preview →
          </button>
        ) : (
          <button onClick={() => go(Math.min(pages.length - 1, idx + 1))} disabled={isLast}
            style={{ background: 'none', border: `1.5px solid ${isLast ? '#D1D5DB' : C.saffron}`, borderRadius: '50%', width: 30, height: 30, cursor: isLast ? 'default' : 'pointer', color: isLast ? '#D1D5DB' : C.saffron, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            ›
          </button>
        )}
      </div>
    </div>
  );
}


export function ThemePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Support two entry paths: navigate() with state (same tab) or window.open() with query params (new tab)
  const locationState = (location.state as { previewUrls?: (string | null)[]; childName?: string; fromPreview?: boolean; gender?: string; ageGroup?: string; age?: string; email?: string } | null)
    ?? (searchParams.get('fromPreview') === 'true' ? {
        fromPreview: true,
        childName:  searchParams.get('name')     || undefined,
        gender:     searchParams.get('gender')   || undefined,
        ageGroup:   searchParams.get('ageGroup') || undefined,
        age:        searchParams.get('age')      || undefined,
        email:      searchParams.get('email')    || undefined,
      } : null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  const theme = THEMES.find(t => t.slug === slug);
  const NINE_PAGE_THEMES = new Set(['abc', 'colours-shapes', 'bedtime-routines', 'numbers-maths', 'sharing-sorry', 'first-day-school', 'managing-emotions', 'indian-festivals', 'history-india', 'financial-literacy', 'growth-mindset', 'professions']);
  const previewPageCount = theme && NINE_PAGE_THEMES.has(theme.slug) ? 9 : 4;
  const hasFaceswapMockup = theme?.slug ? theme.slug in THEME_FACE_SAMPLES : false;
  const useScenes = !!(theme?.comingSoon && !hasFaceswapMockup);
  const sceneFiles = theme?.slug === 'abc'
    ? ['scene_01', 'scene_02', 'scene_03', 'scene_04', 'scene_05']
    : ['scene_01', 'scene_03', 'scene_05', 'scene_07', 'scene_09'];

  const [activeIdx, setActiveIdx] = useState(0);
  const [childName, setChildName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [previewEmail, setPreviewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [previewPhone, setPreviewPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [photo, setPhoto] = useState<{ preview: string; uploading: boolean; signedUrl: string | null; quality?: { score: number; tip: string | null } | null } | null>(null);
  const [consent, setConsent] = useState(false);
  const [jobStatus, setJobStatus] = useState('');
  const [showOrder, setShowOrder] = useState(true);
  const [orderForm, setOrderForm] = useState({ parentName: '', email: '', phone: '', childName: '', childAge: '', childGender: '', bindingType: 'perfect', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', notes: '', dedicationMessage: '' });
  const [orderPhoto, setOrderPhoto] = useState<{ preview: string; uploading: boolean; uploadedPath: string | null; signedUrl: string | null; uploadFailed?: boolean } | null>(null);
  const [orderConsent, setOrderConsent] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [couponInput, setCouponInput] = useState('PROTAGO50');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number; finalPrice: number; discountType: string; discountValue: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    const autoApply = async () => {
      const code = 'PROTAGO50';
      setCouponLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/validate-coupon`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setCouponApplied({ code, discountAmount: data.discountAmount, finalPrice: data.finalPrice, discountType: data.discountType, discountValue: data.discountValue });
        }
      } catch { /* ignore */ }
      setCouponLoading(false);
    };
    autoApply();
  }, []);

  const [generating, setGenerating] = useState(false);
  const [gender, setGender] = useState<'boy' | 'girl' | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<'young' | 'middle' | 'older' | null>(null);
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () => setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  const [formVisible, setFormVisible] = useState(false);
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [theme.slug]);

  const hasSamplePages = !!SAMPLE_PAGES[theme?.slug ?? ''];

  const pickAge = (age: number) => {
    setSelectedAge(age);
    setSelectedAgeGroup(age <= 5 ? 'young' : age <= 8 ? 'middle' : 'older');
  };

  // Reset on theme change
  useEffect(() => { setGender(null); setSelectedAgeGroup(null); setSelectedAge(null); }, [slug]);

  useEffect(() => {
    if (locationState?.fromPreview) {
      // Arriving from PreviewResultPage — prefill everything from the preview form
      setShowOrder(true);
      const ls = locationState;
      // Resolve exact age number: prefer the specific age, fall back to ageGroup midpoints
      const exactAge = ls.age ? Number(ls.age) : ls.ageGroup === 'young' ? 4 : ls.ageGroup === 'middle' ? 6 : ls.ageGroup === 'older' ? 10 : null;
      setOrderForm(f => ({
        ...f,
        childName: ls.childName || f.childName,
        email: ls.email || f.email,
        childGender: ls.gender === 'boy' ? 'Boy' : ls.gender === 'girl' ? 'Girl' : f.childGender,
        childAge: exactAge ? String(exactAge) : f.childAge,
      }));
      if (ls.email) setPreviewEmail(ls.email);
      if (ls.gender === 'boy' || ls.gender === 'girl') setGender(ls.gender);
      if (ls.ageGroup === 'young' || ls.ageGroup === 'middle' || ls.ageGroup === 'older') {
        setSelectedAgeGroup(ls.ageGroup);
        setSelectedAge(exactAge);
      }
      setTimeout(() => {
        document.getElementById('inline-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % getFaceSamples(slug ?? '').length), 2000);
    return () => clearInterval(t);
  }, []);

  if (!theme) {
    navigate('/');
    return null;
  }

  const AGE_COLOR: Record<string, string> = { '0–3': '#7C3AED', '3–5': C.saffron, '6–8': C.gold, '9–12': C.navy };
  const color = AGE_COLOR[Array.isArray(theme.ageRange) ? theme.ageRange[0] : theme.ageRange] || C.saffron;
  const ageLabel = Array.isArray(theme.ageRange)
    ? `${theme.ageRange[0].split('–')[0]}–${theme.ageRange[theme.ageRange.length - 1].split('–')[1]}`
    : theme.ageRange;


  // Pick 6 other themes (same age group first, then others)
  const otherThemes = [
    ...THEMES.filter(t => t.slug !== theme.slug && t.ageRange === theme.ageRange),
    ...THEMES.filter(t => t.slug !== theme.slug && t.ageRange !== theme.ageRange),
  ].slice(0, 6);

  const handleOrder = () => {
    setShowOrder(true);
    setTimeout(() => document.getElementById('inline-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  // Auto-open order form when arriving via ?order=1
  useEffect(() => {
    if (searchParams.get('order') === '1') {
      setShowOrder(true);
      setTimeout(() => document.getElementById('inline-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [slug]);

  const setOf = (k: string, v: string) => setOrderForm(f => ({ ...f, [k]: v }));

  const handleOrderPhotoAdd = (file: File) => {
    const preview = URL.createObjectURL(file);
    setOrderPhoto({ preview, uploading: true, uploadedPath: null, signedUrl: null });
    const reader = new FileReader();
    reader.onload = () => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/upload-photo`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          setOrderPhoto(p => p ? { ...p, uploading: false, uploadedPath: data.photo_url || null, signedUrl: data.photo_signed_url || null } : null);
        } catch { setOrderPhoto(p => p ? { ...p, uploading: false, uploadFailed: true } : null); }
      };
      xhr.onerror = () => setOrderPhoto(p => p ? { ...p, uploading: false, uploadFailed: true } : null);
      xhr.send(JSON.stringify({ photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/validate-coupon`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponApplied({ code: couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, finalPrice: data.finalPrice, discountType: data.discountType, discountValue: data.discountValue });
        setCouponError('');
      } else {
        setCouponApplied(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch { setCouponError('Could not validate coupon. Try again.'); }
    setCouponLoading(false);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderConsent) return;
    if (!orderPhoto?.uploadedPath) {
      setOrderError("Please upload your child's photo before placing the order.");
      return;
    }
    setOrderSubmitting(true);
    setOrderError('');
    try {
      const res = await fetch(`${API_BASE}/api/order-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderForm,
          storyTheme: theme.slug,
          photoSignedUrl: orderPhoto?.signedUrl || null,
          photoPath: orderPhoto?.uploadedPath || null,
          couponCode: couponApplied?.code || null,
          referralSource: localStorage.getItem('protago_ref') || null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to create order'); }
      const { orderId, razorpayKeyId, amount, currency } = await res.json();

      // Dev/mock mode — no real Razorpay keys
      if (!razorpayKeyId || razorpayKeyId.includes('your_')) {
        setOrderSubmitted(true);
        setOrderSubmitting(false);
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Protago',
        description: `Personalised Storybook — ${theme.name}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            // Fire-and-forget confirmation email
            fetch(`${API_BASE}/api/order/send-confirmation-email`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpayOrderId: response.razorpay_order_id }),
            }).catch(() => {});
            navigate('/order-confirmed', { state: { childName: orderForm.childName, email: orderForm.email, amount: amount / 100 } });
          } catch {
            setOrderError('Payment verification failed. Please contact support.');
          } finally {
            setOrderSubmitting(false);
          }
        },
        prefill: { name: orderForm.parentName, email: orderForm.email, contact: orderForm.phone },
        theme: { color: '#FF6B35' },
        modal: {
          ondismiss: () => {
            setOrderSubmitting(false);
            setOrderError('Payment was cancelled. Please try again.');
          },
        },
      };
      new window.Razorpay(options).open();
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setOrderSubmitting(false);
    }
  };

  const handleThemeClick = (slug: string) => {
    navigate(`/theme/${slug}`);
    // scroll handled by the slug useEffect above
  };

  const handlePhotoAdd = (file: File) => {
    const preview = URL.createObjectURL(file);
    setPhoto({ preview, uploading: true, signedUrl: null });

    const img = new Image();
    img.onload = () => {
      // Resize to max 1500px on longest side, re-encode as JPEG q90
      const MAX = 1500;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.90);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/upload-photo`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.photo_signed_url) {
            setPhoto(p => p ? { ...p, uploading: false, signedUrl: data.photo_signed_url, quality: data.photo_quality ?? null } : null);
          } else {
            setPhoto(p => p ? { ...p, uploading: false } : null);
            setJobStatus('Error: Upload failed. Please try a different photo.');
          }
        } catch { setPhoto(p => p ? { ...p, uploading: false } : null); }
      };
      xhr.onerror = () => {
        setPhoto(p => p ? { ...p, uploading: false } : null);
        setJobStatus('Error: Could not upload photo. Please check your connection and try again.');
      };
      xhr.send(JSON.stringify({ photo: base64, originalSize: file.size }));
      URL.revokeObjectURL(preview);
    };
    img.onerror = () => {
      setPhoto(null);
      setJobStatus('Error: Could not read this image. Please try a different file.');
    };
    img.src = preview;
  };

  const handleGenerate = () => {
    const firstName = childName.trim().split(/\s+/)[0];
    if (!firstName) { setNameError(true); return; }
    if (firstName !== childName) setChildName(firstName);
    if (!photo?.signedUrl) return;
    // Basic email format check before hitting backend
    const emailTrimmed = previewEmail.trim();
    if (!emailTrimmed) { setEmailError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) { setEmailError('Enter a valid email address'); return; }
    const phoneTrimmed = previewPhone.trim().replace(/[\s\-().+]/g, '');
    if (!phoneTrimmed) { setPhoneError('WhatsApp number is required'); return; }
    if (!/^[6-9]\d{9}$/.test(phoneTrimmed)) { setPhoneError('Enter a valid 10-digit Indian mobile number'); return; }
    setNameError(false);
    setEmailError('');
    setPhoneError('');
    trackPreviewStarted(theme.slug);
    setGenerating(true);
    setJobStatus('');
    const newTab = window.open('/preview/loading', '_blank');
    (async () => {
      const res = await fetch(`${API_BASE}/api/preview/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storySlug: theme.slug, photoUrl: photo.signedUrl, childName: firstName, email: emailTrimmed, phone: phoneTrimmed, gender: gender ?? undefined, ageGroup: selectedAgeGroup ?? undefined, childAge: selectedAge ?? undefined, photoQualityScore: photo.quality?.score ?? undefined, fbc: document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/)?.[1] ?? undefined, fbp: document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/)?.[1] ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        newTab?.close();
        setJobStatus(`Error: ${data.error}`);
        setGenerating(false);
        return;
      }
      const params = new URLSearchParams({ name: childName, theme: theme.slug });
      if (gender) params.set('gender', gender);
      if (selectedAgeGroup) params.set('ageGroup', selectedAgeGroup);
      if (selectedAge !== null) params.set('age', String(selectedAge));
      if (emailTrimmed) params.set('email', emailTrimmed);
      if (newTab) newTab.location.href = `/preview/${data.jobId}?${params}`;
      setGenerating(false);
      setJobStatus('opened');
    })();
  };

  const canGenerate = !!childName.trim() && !!photo?.signedUrl && consent && !generating && !!gender && !!selectedAgeGroup && !!previewPhone.trim();

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        .book-hook-face-col { display: flex; }
        .book-preview-sticky-cta { display: none; }
        .book-page-overlay { display: block; }
        .book-page-text-below { display: none; }
        .explore-themes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 640px) {
          .book-hook-face-col { display: none !important; }
          .book-preview-sticky-cta { display: flex !important; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; padding: 12px 20px 20px; background: linear-gradient(to top, rgba(255,255,255,1) 60%, rgba(255,255,255,0)); }
          .book-page-overlay { display: none !important; }
          .book-page-text-below { display: block !important; }
          .explore-themes-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
      `}</style>

      <NavBar />

      <div style={{ maxWidth: 920, margin: '0 auto', paddingTop: 130, paddingBottom: 0 }}>

        {/* ── Book preview hook (only for themes with sample pages) ── */}
        {hasSamplePages && (
          <div style={{ display: 'flex', gap: 0, margin: '0 16px 20px', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', background: C.white }}>
            {/* 3/4: Book viewer */}
            <div style={{ flex: 3, borderRight: '1px solid #F0EEE8', background: '#FAFAFA' }}>
              <SampleBookViewer slug={theme.slug} onGetPreview={scrollToForm} />
            </div>
            {/* 1/4: Face animation + CTA (hidden on mobile) */}
            <div className="book-hook-face-col" style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', gap: 16, minWidth: 160 }}>
              {/* Scene preview or face animation */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: '#F0EEE8' }}>
                {useScenes ? (
                  sceneFiles.map((s, i) => (
                    <motion.img key={s}
                      src={`/themes_scenes/${theme.slug}/${s}.webp`}
                      alt="" decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                      animate={{ opacity: i === activeIdx % 5 ? 1 : 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  ))
                ) : (
                  <>
                    {getFaceSamples(theme.slug).map((sample, i) => (
                      <motion.img key={sample.key}
                        src={`/themes_mockup/${theme.slug}_${sample.key}_mockup.webp`}
                        alt="" decoding="async"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                        animate={{ opacity: i === activeIdx ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ))}
                    {(() => { const at = getArrowTarget(theme.slug); return (
                      <svg viewBox="0 0 160 90" preserveAspectRatio="none"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
                        <motion.path d={`M 148 4 Q 148 40 ${at.x} ${at.y}`} fill="none" stroke={C.saffron}
                          strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ pathLength: { duration: 1.0, delay: 0.2 }, opacity: { duration: 0.2 } }}
                          key={activeIdx} />
                        <motion.path d={`M ${at.x + 8} ${at.y - 5} L ${at.x} ${at.y} L ${at.x + 7} ${at.y + 5}`} fill="none" stroke={C.saffron}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
                          key={`ah-${activeIdx}`} />
                      </svg>
                    ); })()}
                    {/* Face bubble */}
                    <div style={{ position: 'absolute', top: 8, right: 10, width: 48, height: 48, zIndex: 10 }}>
                      {getFaceSamples(theme.slug).map((sample, i) => (
                        <motion.img key={sample.face} src={sample.face} alt="" decoding="async"
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                            borderRadius: '50%', border: `2.5px solid ${C.saffron}`, boxShadow: '0 3px 12px rgba(255,107,53,0.35), 0 0 0 2px #fff' }}
                          animate={{ opacity: i === activeIdx ? 1 : 0, scale: i === activeIdx ? 1 : 0.9 }}
                          transition={{ duration: 0.4 }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 13, color: C.navy, textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
                See your child<br />in this story
              </p>
              <button onClick={scrollToForm}
                style={{ background: `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: '0 4px 14px rgba(255,107,53,0.4)', width: '100%', textAlign: 'center' }}>
                ✨ Get Preview →
              </button>
              <p style={{ fontSize: 10, color: C.lgray, textAlign: 'center', margin: 0 }}>Free · ~2 min · No card required</p>
            </div>
          </div>
        )}

        {/* ── Sticky mobile CTA (only for themes with sample pages, hidden once form is visible) ── */}
        {hasSamplePages && !formVisible && (
          <div className="book-preview-sticky-cta">
            <button onClick={scrollToForm}
              style={{ background: `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: '0 4px 20px rgba(255,107,53,0.45)', width: '100%', textAlign: 'center' }}>
              ✨ Get Free Preview →
            </button>
          </div>
        )}

        {/* ── Two-column card ── */}
        <div id="inline-order" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', background: C.white, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.07)', margin: '0 16px' }}>

          {/* LEFT: animation + info */}
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #F5F5F5' }}>

            {/* Scene animation — or actual preview images if coming from PreviewResultPage */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {locationState?.previewUrls?.some(u => u) ? (
                /* ── Actual generated preview images ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {locationState.previewUrls.filter(Boolean).map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '16/9', background: '#F0EEE8', overflow: 'hidden', borderBottom: i === 0 ? '2px solid #F0EEE8' : undefined }}>
                      <motion.img src={url!} alt={`Preview scene ${i + 1}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: i * 0.15 }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {i === 0 && (
                        <div style={{ position: 'absolute', top: 8, left: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#fff', backdropFilter: 'blur(4px)' }}>
                          ✨ Your preview
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px 12px', background: '#F0FDF4', borderTop: '1px solid #BBF7D0' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#166534', margin: 0 }}>✓ Preview generated — your child's face in every scene</p>
                  </div>
                </div>
              ) : (
                /* ── Default face-swap animation (or raw scenes for comingSoon) ── */
                <div style={{ aspectRatio: '1/1', background: '#F0EEE8', position: 'relative', overflow: 'hidden' }}>
                  {useScenes ? (
                    sceneFiles.map((s, i) => (
                      <motion.img key={s}
                        src={`/themes_scenes/${theme.slug}/${s}.webp`}
                        alt="" decoding="async"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                        animate={{ opacity: i === activeIdx % 5 ? 1 : 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    ))
                  ) : getFaceSamples(theme.slug).map((sample, i) => (
                    <motion.img key={sample.key}
                      src={`/themes_mockup/${theme.slug}_${sample.key}_mockup.webp`}
                      alt="" decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                      animate={{ opacity: i === activeIdx ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                  {!useScenes && (() => { const at = getArrowTarget(theme.slug); return (
                    <svg viewBox="0 0 160 90" preserveAspectRatio="none"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
                      <motion.path d={`M 148 4 Q 148 40 ${at.x} ${at.y}`} fill="none" stroke={C.saffron}
                        strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ pathLength: { duration: 1.0, delay: 0.2 }, opacity: { duration: 0.2 } }}
                        key={activeIdx} />
                      <motion.path d={`M ${at.x + 8} ${at.y - 5} L ${at.x} ${at.y} L ${at.x + 7} ${at.y + 5}`} fill="none" stroke={C.saffron}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
                        key={`ah-${activeIdx}`} />
                    </svg>
                  ); })()}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '30px 16px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', zIndex: 4 }}>
                    <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', margin: 0 }}>
                      {theme.icon} {theme.name}
                    </p>
                  </div>
                </div>
              )}
              {!locationState?.previewUrls?.some(u => u) && !useScenes && (
                <div style={{ position: 'absolute', top: 12, right: 16, width: 72, height: 72, zIndex: 10 }}>
                  {getFaceSamples(theme.slug).map((sample, i) => (
                    <motion.img key={sample.face} src={sample.face} alt="" decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                        borderRadius: '50%', border: `3px solid ${C.saffron}`, boxShadow: '0 4px 16px rgba(255,107,53,0.35), 0 0 0 3px #fff' }}
                      animate={{ opacity: i === activeIdx ? 1 : 0, scale: i === activeIdx ? 1 : 0.9 }}
                      transition={{ duration: 0.4 }} />
                  ))}
                </div>
              )}
            </div>

            {/* Price + promo strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#FFF7ED', borderTop: '1px solid #FFE4CC', borderBottom: '1px solid #FFE4CC' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#22C55E', borderRadius: 50, padding: '2px 8px' }}>35% OFF</span>
              <span style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600 }}>₹1,499</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: "'Baloo 2', sans-serif" }}>₹974</span>
              <span style={{ fontSize: 11, color: C.saffron, fontWeight: 700 }}>· Use code <strong>PROTAGO50</strong></span>
            </div>

            {/* Info */}
            <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', padding: '3px 10px', borderRadius: 20, border: `1px solid ${color}30` }}>
                  Ages {ageLabel}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: 20, border: '1px solid #E5E7EB' }}>
                  32 pages
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: C.gray, margin: 0 }}>{theme.description}</p>

              {/* Feature bullets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0' }}>
                {[
                  `Perfect for children aged ${ageLabel}`,
                  'Add your child\'s name & photo',
                  'Preview for free in ~2 min',
                  'Order a printed book anytime',
                ].map((label, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.saffron, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: C.gray }}>{label}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleOrder}
                style={{ width: '100%', background: 'none', border: `1.5px solid ${C.saffron}`, borderRadius: 10, padding: '11px 16px', fontWeight: 800, fontSize: 13, color: C.saffron, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", marginTop: 4 }}>
                Skip preview — Order this story →
              </button>
            </div>
          </div>

          {/* RIGHT: order form */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', background: C.white, overflow: 'hidden' }}>
            {/* Gradient header */}
            <div style={{ background: `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`, padding: '24px 28px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 1.8, margin: '0 0 4px' }}>Order your book</p>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', margin: '0 0 4px' }}>{theme.icon} {theme.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', background: 'rgba(255,255,255,0.15)', borderRadius: 50, padding: '2px 8px' }}>35% OFF</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'line-through', fontWeight: 600 }}>₹1,499</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Baloo 2', sans-serif" }}>₹974</span>
              </div>
            </div>

            <style>{`
              @media (max-width: 600px) {
                .of-row1 { grid-template-columns: 1fr !important; }
                .of-photo-addr { grid-template-columns: 1fr !important; }
                .of-form { padding: 16px !important; }
              }
            `}</style>

            {orderSubmitted ? (
              <div style={{ padding: '60px 36px', textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.navy, fontSize: 22, margin: '0 0 8px' }}>Order received!</h3>
                <p style={{ fontSize: 14, color: C.gray, margin: 0, lineHeight: 1.7 }}>Your order is confirmed! We'll keep you updated on <strong>{orderForm.email}</strong>.</p>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="of-form" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {orderError && (
                  <div style={{ padding: '12px 14px', background: '#FFF0F0', borderRadius: 8, border: '1px solid #FFCDD2' }}>
                    <p style={{ fontSize: 13, color: '#C0392B', margin: 0 }}>{orderError}</p>
                  </div>
                )}

                {/* Row 1: name + email + phone */}
                <div className="of-row1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Your name *', key: 'parentName', placeholder: 'Priya Sharma', type: 'text' },
                    { label: 'Email *', key: 'email', placeholder: 'you@email.com', type: 'email' },
                    { label: 'WhatsApp *', key: 'phone', placeholder: '+91 98765 43210', type: 'tel' },
                  ].map(({ label, key, placeholder, type }) => (
                    <div key={key}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
                      <input required type={type} placeholder={placeholder} value={orderForm[key as keyof typeof orderForm]}
                        onChange={e => setOf(key, e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                        onFocus={e => (e.target.style.borderColor = C.saffron)}
                        onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                    </div>
                  ))}
                </div>

                {/* Row 2: child name + age + gender */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Child's name *</label>
                    <input required placeholder="Arjun" value={orderForm.childName} onChange={e => setOf('childName', e.target.value)}
                      style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                      onFocus={e => (e.target.style.borderColor = C.saffron)}
                      onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Age *</label>
                    <select required value={orderForm.childAge} onChange={e => setOf('childAge', e.target.value)}
                      style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}>
                      <option value="">Select age</option>
                      {Array.from({ length: 13 }, (_, i) => i).map(a => <option key={a} value={a}>{a === 0 ? 'Under 1 year' : a === 1 ? '1 year old' : `${a} years old`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Gender *</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Boy', 'Girl'].map(g => (
                        <button type="button" key={g} onClick={() => setOf('childGender', g)}
                          style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${orderForm.childGender === g ? C.saffron : '#E5E7EB'}`, background: orderForm.childGender === g ? '#FFF3EE' : '#fff', color: orderForm.childGender === g ? C.saffron : '#9CA3AF' }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Binding type */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Binding type</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { value: 'perfect', icon: '📖', label: 'Perfect Binding', desc: 'Premium 200GSM · Lay-flat pages · Vivid print', price: 'Included', available: true },
                      { value: 'hardcover', icon: '📚', label: 'Hardcover', desc: 'Rigid boards · Extra durable', price: 'Coming soon', available: false },
                    ].map(({ value, icon, label, desc, price, available }) => {
                      const selected = orderForm.bindingType === value;
                      return (
                        <button key={value} type="button" disabled={!available}
                          onClick={() => available && setOf('bindingType', value)}
                          style={{
                            flex: 1, padding: '12px 14px', borderRadius: 12, cursor: available ? 'pointer' : 'default',
                            border: `2px solid ${selected ? C.saffron : available ? '#E5E7EB' : '#F0F0F0'}`,
                            background: selected ? 'linear-gradient(135deg, #FFF3EE 0%, #FFF8F4 100%)' : available ? '#fff' : '#FAFAFA',
                            textAlign: 'left', transition: 'all 0.15s',
                            boxShadow: selected ? `0 0 0 3px ${C.saffron}22` : 'none',
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 22 }}>{icon}</span>
                            {selected && <span style={{ width: 18, height: 18, borderRadius: '50%', background: C.saffron, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 800, flexShrink: 0 }}>✓</span>}
                            {!available && <span style={{ fontSize: 9, fontWeight: 800, background: '#7C3AED', color: '#fff', borderRadius: 20, padding: '2px 7px', letterSpacing: 0.3 }}>SOON</span>}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: available ? (selected ? C.saffron : C.navy) : '#BDBDBD', lineHeight: 1.2 }}>{label}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: selected ? C.saffron : available ? '#22C55E' : '#BDBDBD', marginTop: 5 }}>{price}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 3: photo (with tips) + address */}
                <div className="of-photo-addr" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Child's photo *</label>
                    {/* Photo tips 2×2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {[
                        { img: '/photo-tips/good.avif',       label: 'Front-facing', good: true },
                        { img: '/photo-tips/group.jpg',       label: 'One person',   good: false },
                        { img: '/photo-tips/sunglasses.avif', label: 'No glasses',   good: false },
                        { img: '/photo-tips/sideangle.jpg',   label: 'No side angle',good: false },
                      ].map(({ img, label, good }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ position: 'relative' }}>
                            <img src={img} alt={label} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `2.5px solid ${good ? '#22C55E' : '#EF4444'}`, display: 'block' }} />
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 17, height: 17, borderRadius: '50%', background: good ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 800, border: '2px solid #fff' }}>
                              {good ? '✓' : '✕'}
                            </div>
                          </div>
                          <p style={{ fontSize: 9, color: C.gray, textAlign: 'center', lineHeight: 1.3, margin: 0 }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    {!orderPhoto ? (
                      <>
                        <label style={{ border: `2px dashed ${C.saffron}`, borderRadius: 10, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', background: '#FFF8F0', flex: 1, justifyContent: 'center' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FFF0E0')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#FFF8F0')}>
                          <span style={{ fontSize: 24 }}>📸</span>
                          <span style={{ fontWeight: 700, color: C.navy, fontSize: 12, textAlign: 'center' }}>Upload photo</span>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleOrderPhotoAdd(f); }} />
                        </label>
                        <p style={{ fontSize: 11, color: C.saffron, fontWeight: 700, margin: '2px 0 0', textAlign: 'center', lineHeight: 1.4 }}>
                          ⚠️ Required to place order
                        </p>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: orderPhoto.uploadFailed ? '#FFF7ED' : '#F0FDF4', borderRadius: 10, border: `1.5px solid ${orderPhoto.uploadFailed ? '#FED7AA' : '#BBF7D0'}` }}>
                        <img src={orderPhoto.preview} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} alt="" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: orderPhoto.uploading ? '#166534' : orderPhoto.uploadFailed ? '#C2410C' : '#166534' }}>
                            {orderPhoto.uploading ? '⏳ Uploading…' : orderPhoto.uploadFailed ? '⚠ Upload failed' : '✓ Ready'}
                          </div>
                          {orderPhoto.uploadFailed && (
                            <label style={{ fontSize: 11, color: C.saffron, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                              Tap to retry
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleOrderPhotoAdd(f); }} />
                            </label>
                          )}
                        </div>
                        {!orderPhoto.uploading && <button type="button" onClick={() => setOrderPhoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Delivery address</label>
                    {[
                      { key: 'addressLine1', label: 'Address line 1 *', placeholder: 'Flat / House no., Building, Street', required: true },
                      { key: 'addressLine2', label: 'Address line 2 (optional)', placeholder: 'Area, Landmark', required: false },
                    ].map(({ key, label, placeholder, required }) => (
                      <div key={key}>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</label>
                        <input required={required} placeholder={placeholder}
                          value={orderForm[key as keyof typeof orderForm]} onChange={e => setOf(key, e.target.value)}
                          style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                          onFocus={e => (e.target.style.borderColor = C.saffron)}
                          onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {[
                        { key: 'city', label: 'City *', placeholder: 'e.g. Mumbai' },
                        { key: 'state', label: 'State *', placeholder: 'e.g. Maharashtra' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</label>
                          <input required placeholder={placeholder}
                            value={orderForm[key as keyof typeof orderForm]} onChange={e => setOf(key, e.target.value)}
                            style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                            onFocus={e => (e.target.style.borderColor = C.saffron)}
                            onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Pincode *</label>
                        <input required placeholder="e.g. 400001" inputMode="numeric" maxLength={6} pattern="[0-9]{6}"
                          value={orderForm.pincode} onChange={e => setOf('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                          style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
                          onFocus={e => (e.target.style.borderColor = C.saffron)}
                          onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                      </div>
                      <div>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Country</label>
                        <input value="India" readOnly style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#F9FAFB', color: '#9CA3AF' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dedication message */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Personal message for the first page <span style={{ color: '#C4B5A0', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <textarea
                    placeholder={`e.g. "To my little star — may you always reach for the sky. With all my love, ${orderForm.parentName || 'Mama'}"`}
                    value={orderForm.dedicationMessage}
                    onChange={e => setOf('dedicationMessage', e.target.value)}
                    rows={2}
                    maxLength={200}
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', resize: 'none' }}
                    onFocus={e => (e.target.style.borderColor = '#FF6B35')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                  <p style={{ fontSize: 10, color: '#9CA3AF', margin: '4px 0 0' }}>
                    🎬 Printed on the first page — Starring <strong>{orderForm.childName || 'your child'}</strong> · Produced with love by <strong>{orderForm.parentName || 'you'}</strong>
                  </p>
                </div>

                {/* Coupon code */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Promo code (optional)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="e.g. WELCOME20"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponApplied(null); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                      style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
                      onFocus={e => (e.target.style.borderColor = C.saffron)}
                      onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                    <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                      style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: couponLoading || !couponInput.trim() ? 'default' : 'pointer', opacity: couponLoading || !couponInput.trim() ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                      {couponLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  {couponApplied && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FFF4', border: '1.5px solid #22C55E', borderRadius: 9, padding: '8px 12px' }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>✓ {couponApplied.code} applied! </span>
                        <span style={{ fontSize: 12, color: '#16A34A' }}>
                          {couponApplied.discountType === 'percent' ? `${couponApplied.discountValue}% off` : `₹${couponApplied.discountAmount} off`}
                        </span>
                      </div>
                      <button type="button" onClick={() => { setCouponApplied(null); setCouponInput(''); }}
                        style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                    </div>
                  )}
                  {couponError && <p style={{ fontSize: 12, color: '#EF4444', margin: '6px 0 0' }}>{couponError}</p>}
                </div>

                {/* Consent + submit */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" required checked={orderConsent} onChange={e => setOrderConsent(e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0, accentColor: C.saffron, width: 15, height: 15, cursor: 'pointer' }} />
                  <span style={{ fontSize: 11, lineHeight: 1.6, color: '#9CA3AF' }}>
                    I confirm I am 18+ and have obtained parental consent to share this information per the{' '}
                    <a href="/privacy" style={{ color: C.saffron, textDecoration: 'underline' }}>Privacy Policy</a>.
                  </span>
                </label>

                {orderPhoto?.uploadFailed && !orderPhoto.uploading && (
                  <p style={{ fontSize: 12, color: '#C2410C', fontWeight: 600, textAlign: 'center', margin: '0 0 -4px' }}>
                    Photo upload failed — please tap "Tap to retry" above before placing your order.
                  </p>
                )}
                <button type="submit" disabled={orderSubmitting || !orderConsent || !orderPhoto?.uploadedPath}
                  style={{ background: (!orderConsent || orderSubmitting || !orderPhoto?.uploadedPath) ? '#E5E7EB' : `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`, color: (!orderConsent || orderSubmitting || !orderPhoto?.uploadedPath) ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 800, fontSize: 16, cursor: (!orderConsent || orderSubmitting || !orderPhoto?.uploadedPath) ? 'default' : 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: (!orderConsent || orderSubmitting || !orderPhoto?.uploadedPath) ? 'none' : '0 4px 16px rgba(255,107,53,0.4)' }}>
                  {orderSubmitting ? 'Processing…' : `Pay ₹${couponApplied ? couponApplied.finalPrice : (Number(import.meta.env.VITE_STORYBOOK_PRICE) || 499)} & Order →`}
                </button>
                <p style={{ fontSize: 11, color: C.lgray, textAlign: 'center', margin: '-4px 0 0' }}>Delivered in 5–7 business days</p>

              </form>
            )}
          </div>
        </div>

        {/* ── Free preview (below order form) ── */}
        {!theme.comingSoon && (
          <>
            <div style={{ margin: '40px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>Or try a free preview first</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>
            <div ref={formRef} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', background: C.white, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.07)', margin: '16px 16px 0' }}>
              <div style={{ width: '100%', padding: '32px 28px 36px', display: 'flex', flexDirection: 'column', background: C.white }}>
                <AnimatePresence mode="wait">
                  {jobStatus === 'opened' ? (
                    <motion.div key="opened" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0', textAlign: 'center', flex: 1, justifyContent: 'center' }}>
                      <div style={{ fontSize: 56 }}>✨</div>
                      <p style={{ fontWeight: 800, color: C.navy, fontSize: 17, margin: 0, fontFamily: "'Baloo 2', sans-serif" }}>Preview is generating!</p>
                      <p style={{ fontSize: 13, color: C.lgray, margin: 0 }}>Check the new tab — ready in ~2 min.</p>
                      <button onClick={() => { setJobStatus(''); setPhoto(null); setChildName(''); setGenerating(false); setConsent(false); }}
                        style={{ marginTop: 8, background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 20px', fontSize: 13, color: C.gray, cursor: 'pointer', fontWeight: 700 }}>
                        Generate another →
                      </button>
                    </motion.div>

                  ) : generating ? (
                    <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ textAlign: 'center', padding: '50px 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        style={{ fontSize: 40, marginBottom: 14 }}>⚙️</motion.div>
                      <p style={{ fontSize: 14, color: C.lgray }}>Starting your preview…</p>
                    </motion.div>

                  ) : (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                      {/* Header */}
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.saffron, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 4px' }}>Free {previewPageCount}-Page Preview</p>
                      <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 21, color: C.navy, margin: '0 0 24px', lineHeight: 1.2 }}>
                        See your child<br />in this story
                      </h2>

                      {jobStatus.startsWith('Error') && (
                        <div style={{ padding: '10px 14px', background: '#FFF0F0', borderRadius: 8, marginBottom: 14, border: '1px solid #FFCDD2' }}>
                          <p style={{ fontSize: 12, color: '#C0392B', margin: 0 }}>{jobStatus}</p>
                        </div>
                      )}

                      {/* Step 1: Name */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
                          Child's name <span style={{ color: C.saffron }}>*</span>
                        </label>
                        <input
                          placeholder="e.g. Aryan"
                          value={childName}
                          onChange={e => { setChildName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                          onBlur={e => { const first = e.target.value.trim().split(/\s+/)[0]; setChildName(first); }}
                          style={{
                            border: `1.5px solid ${nameError ? '#E53E3E' : '#E5E7EB'}`,
                            borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none',
                            width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                            background: nameError ? '#FFF5F5' : '#fff',
                            transition: 'border-color 0.2s',
                          }} />
                        {nameError && <p style={{ fontSize: 11, color: '#E53E3E', margin: '4px 0 0' }}>Please enter your child's name</p>}
                      </div>

                      {/* Gender toggle */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 8 }}>
                          Child's gender <span style={{ color: C.saffron }}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(['boy', 'girl'] as const).map(g => (
                            <button key={g} type="button" onClick={() => setGender(g)}
                              style={{
                                flex: 1, padding: '11px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                                border: `1.5px solid ${gender === g ? C.saffron : '#E5E7EB'}`,
                                background: gender === g ? C.saffron + '18' : '#fff',
                                color: gender === g ? C.saffron : C.gray,
                                fontWeight: 800, fontSize: 15,
                                transition: 'all 0.15s',
                              }}>
                              {g === 'boy' ? '👦 Boy' : '👧 Girl'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Age picker — individual ages 3–12 */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 8 }}>
                          Child's age <span style={{ color: C.saffron }}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {[3,4,5,6,7,8,9,10,11,12].map(age => {
                            const sel = selectedAge === age;
                            return (
                              <button key={age} type="button" onClick={() => pickAge(age)}
                                style={{
                                  width: 40, height: 40, borderRadius: 10, cursor: 'pointer',
                                  fontFamily: 'inherit', fontWeight: 800, fontSize: 14,
                                  border: `1.5px solid ${sel ? C.saffron : '#E5E7EB'}`,
                                  background: sel ? C.saffron : '#fff',
                                  color: sel ? '#fff' : C.gray,
                                  transition: 'all 0.15s',
                                }}>
                                {age}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Email */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
                          Your email <span style={{ color: C.saffron }}>*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="you@email.com"
                          value={previewEmail}
                          onChange={e => { setPreviewEmail(e.target.value); if (emailError) setEmailError(''); }}
                          style={{
                            border: `1.5px solid ${emailError ? '#E53E3E' : '#E5E7EB'}`,
                            borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none',
                            width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                            background: emailError ? '#FFF5F5' : '#fff',
                            transition: 'border-color 0.2s',
                          }}
                          onFocus={e => (e.target.style.borderColor = emailError ? '#E53E3E' : C.saffron)}
                          onBlur={e => (e.target.style.borderColor = emailError ? '#E53E3E' : '#E5E7EB')} />
                        {emailError
                          ? <p style={{ fontSize: 11, color: '#E53E3E', margin: '4px 0 0' }}>{emailError}</p>
                          : <p style={{ fontSize: 13, fontWeight: 700, color: '#E53E3E', margin: '6px 0 0' }}>⭐ We'll send your preview here so you can always access it</p>
                        }
                      </div>

                      {/* WhatsApp */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
                          WhatsApp number <span style={{ color: C.saffron }}>*</span>
                        </label>
                        <div style={{ display: 'flex', border: `1.5px solid ${phoneError ? '#E53E3E' : '#E5E7EB'}`, borderRadius: 10, overflow: 'hidden', background: phoneError ? '#FFF5F5' : '#fff', transition: 'border-color 0.2s' }}
                          onFocus={() => {}} >
                          <span style={{ padding: '12px 12px', fontSize: 15, fontWeight: 700, color: C.gray, background: '#F9FAFB', borderRight: '1.5px solid #E5E7EB', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>+91</span>
                          <input
                            type="tel"
                            placeholder="98765 43210"
                            value={previewPhone}
                            maxLength={10}
                            onChange={e => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPreviewPhone(digits);
                              if (phoneError) setPhoneError('');
                            }}
                            style={{
                              border: 'none', padding: '12px 14px', fontSize: 15, outline: 'none',
                              flex: 1, fontFamily: 'inherit', background: 'transparent',
                            }}
                            onFocus={e => (e.target.closest('div') as HTMLDivElement).style.borderColor = phoneError ? '#E53E3E' : C.saffron}
                            onBlur={e => (e.target.closest('div') as HTMLDivElement).style.borderColor = phoneError ? '#E53E3E' : '#E5E7EB'} />
                        </div>
                        {phoneError
                          ? <p style={{ fontSize: 11, color: '#E53E3E', margin: '4px 0 0' }}>{phoneError}</p>
                          : <p style={{ fontSize: 11, color: C.lgray, margin: '4px 0 0' }}>We'll send your preview link on WhatsApp</p>
                        }
                      </div>

                      {/* Step 2: Photo */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
                          Child's photo <span style={{ color: C.saffron }}>*</span>
                        </label>
                        {/* Photo tips */}
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.lgray, textAlign: 'center', margin: '0 0 8px' }}>Tips</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                            {[
                              { img: '/photo-tips/good.avif',       label: 'Clear front-facing', good: true },
                              { img: '/photo-tips/group.jpg',       label: 'Only one person',    good: false },
                              { img: '/photo-tips/sunglasses.avif', label: 'No accessories',     good: false },
                              { img: '/photo-tips/sideangle.jpg',   label: 'No side angle',      good: false },
                            ].map(({ img, label, good }) => (
                              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ position: 'relative', width: 52, height: 52 }}>
                                  <img src={img} alt={label} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `2.5px solid ${good ? '#22C55E' : '#EF4444'}` }} />
                                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: good ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 800, border: '1.5px solid #fff' }}>
                                    {good ? '✓' : '✕'}
                                  </div>
                                </div>
                                <p style={{ fontSize: 8, color: C.gray, textAlign: 'center', lineHeight: 1.3, margin: 0 }}>{label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {!photo ? (
                          <label style={{
                            border: '2px dashed #E5E7EB', borderRadius: 12, padding: '22px 14px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            cursor: 'pointer', background: '#FAFAFA', transition: 'border-color 0.2s',
                          }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = C.saffron)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                            <span style={{ fontSize: 34 }}>📸</span>
                            <span style={{ fontWeight: 700, color: C.navy, fontSize: 13 }}>Upload child's photo</span>
                            <span style={{ fontSize: 11, color: C.lgray }}>Clear, front-facing works best</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.saffron, textAlign: 'center' }}>📷 Higher quality photo = better results</span>
                            <span style={{ fontSize: 10, color: C.lgray, textAlign: 'center' }}>Any size accepted · Auto-compressed · JPG, PNG, HEIC</span>
                            <input type="file" accept="image/*" style={{ display: 'none' }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoAdd(f); }} />
                          </label>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F0FDF4', borderRadius: 10, border: '1.5px solid #BBF7D0' }}>
                              <img src={photo.preview} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} alt="" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>{photo.uploading ? '⏳ Uploading…' : '✓ Photo ready'}</div>
                                {photo.uploading && <div style={{ fontSize: 11, color: '#166534', opacity: 0.7 }}>Please wait…</div>}
                              </div>
                              {!photo.uploading && (
                                <button onClick={() => setPhoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.lgray, fontSize: 20, lineHeight: 1, flexShrink: 0 }}>×</button>
                              )}
                            </div>

                            {/* Photo quality score */}
                            {!photo.uploading && photo.quality && (() => {
                              const { score, tip } = photo.quality!;
                              const color = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
                              const bg    = score >= 75 ? '#f0fdf4' : score >= 50 ? '#fffbeb' : '#fef2f2';
                              const border = score >= 75 ? '#bbf7d0' : score >= 50 ? '#fde68a' : '#fecaca';
                              const label = score >= 75 ? 'Great photo!' : score >= 50 ? 'Decent photo' : 'Low image quality';
                              return (
                                <div style={{ padding: '10px 12px', background: bg, borderRadius: 10, border: `1.5px solid ${border}` }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tip ? 6 : 0 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      {/* Progress bar */}
                                      <div style={{ width: 80, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                                      </div>
                                      <span style={{ fontSize: 13, fontWeight: 800, color, minWidth: 36, textAlign: 'right' }}>{score}%</span>
                                    </div>
                                  </div>
                                  {tip && <p style={{ margin: 0, fontSize: 11, color, lineHeight: 1.5 }}>{tip}</p>}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Consent */}
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
                        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                          style={{ marginTop: 2, flexShrink: 0, accentColor: C.saffron, width: 15, height: 15, cursor: 'pointer' }} />
                        <span style={{ fontSize: 12, lineHeight: 1.6, color: C.gray }}>
                          I confirm that I am at least 18 years old and have obtained consent from the child's parent or guardian to share this information for the purpose of creating a personalised storybook, in accordance with the{' '}
                          <a href="/privacy" style={{ color: C.saffron, textDecoration: 'underline' }}>Privacy Policy</a>.
                        </span>
                      </label>

                      {/* Generate button */}
                      {theme.comingSoon ? (
                        <div style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: 12, padding: '14px 18px', textAlign: 'center' }}>
                          <p style={{ fontWeight: 800, fontSize: 15, color: '#7C3AED', margin: '0 0 4px', fontFamily: "'Baloo 2', sans-serif" }}>🚀 Preview Coming Soon</p>
                          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>We're still generating sample scenes — check back soon!</p>
                        </div>
                      ) : (
                        <button disabled={!canGenerate} onClick={handleGenerate}
                          style={{
                            background: canGenerate ? `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)` : '#E5E7EB',
                            color: canGenerate ? '#fff' : '#9CA3AF',
                            border: 'none', borderRadius: 12, padding: '15px 18px',
                            fontWeight: 800, fontSize: 16, cursor: canGenerate ? 'pointer' : 'default',
                            fontFamily: "'Baloo 2', sans-serif", transition: 'all 0.2s',
                            boxShadow: canGenerate ? '0 4px 16px rgba(255,107,53,0.4)' : 'none',
                          }}>
                          ✨ Generate Free {previewPageCount}-Page Preview
                        </button>
                      )}
                      {!theme.comingSoon && <p style={{ fontSize: 11, color: C.lgray, textAlign: 'center', margin: '10px 0 0' }}>Free · ~2 min · No card required</p>}

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

        {/* ── Explore more themes ── */}
        <div style={{ padding: '48px 16px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 18, color: C.navy, margin: 0 }}>
              Explore more themes
            </h3>
            <button onClick={() => navigate('/?scroll=themes')}
              style={{ background: 'none', border: `1.5px solid ${C.saffron}`, borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: C.saffron, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", whiteSpace: 'nowrap' }}>
              View all →
            </button>
          </div>
          <div className="explore-themes-grid">
            {otherThemes.map(t => (
              <button key={t.slug} onClick={() => handleThemeClick(t.slug)}
                style={{ background: C.white, border: '1.5px solid #F0EEE8', borderRadius: 12, overflow: 'visible', cursor: 'pointer', textAlign: 'left', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s, transform 0.15s', position: 'relative' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}>

                {/* Face circle */}
                <div style={{ position: 'absolute', top: -16, right: 8, width: 36, height: 36, zIndex: 10, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${C.saffron}`, boxShadow: '0 2px 8px rgba(255,107,53,0.3), 0 0 0 1.5px #fff' }}>
                  {getFaceSamples(t.slug).map((s, i) => (
                    <motion.img key={s.key} src={s.face} alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                      animate={{ opacity: i === activeIdx ? 1 : 0 }} transition={{ duration: 0.5 }} />
                  ))}
                </div>

                <div style={{ borderRadius: '12px 12px 0 0', aspectRatio: '4/3', background: '#F0EEE8', overflow: 'hidden', position: 'relative' }}>
                  {getFaceSamples(t.slug).map((s, i) => (
                    <motion.img key={s.key}
                      src={`/themes_mockup/${t.slug}_${s.key}_mockup.webp`} alt=""
                      loading="lazy" decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      animate={{ opacity: i === activeIdx ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ))}
                  {/* Arrow from face to scene */}
                  {(() => { const at = getArrowTarget(t.slug); return (
                    <svg viewBox="0 0 160 90" preserveAspectRatio="none"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
                      <motion.path d={`M 148 4 Q 148 40 ${at.x} ${at.y}`} fill="none" stroke={C.saffron}
                        strokeWidth="1.8" strokeLinecap="round" strokeDasharray="5 3"
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }} key={`arrow-${activeIdx}`} />
                      <motion.path d={`M ${at.x + 8} ${at.y - 5} L ${at.x} ${at.y} L ${at.x + 7} ${at.y + 5}`} fill="none" stroke={C.saffron}
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: 1.0 }} key={`arrowhead-${activeIdx}`} />
                    </svg>
                  ); })()}
                </div>

                <div style={{ padding: '8px 10px 10px' }}>
                  <p style={{ fontSize: 'clamp(12px, 3.5vw, 15px)', fontWeight: 700, color: C.navy, margin: 0, lineHeight: 1.3 }}>{t.icon} {t.name}</p>
                  <p style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: C.lgray, margin: '3px 0 0' }}>Ages {Array.isArray(t.ageRange) ? `${t.ageRange[0].split('–')[0]}–${t.ageRange[t.ageRange.length-1].split('–')[1]}` : t.ageRange}</p>
                </div>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button onClick={() => navigate('/?scroll=themes')}
              style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 24, padding: '12px 32px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
              Browse all {THEMES.length} themes →
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ background: C.navy, padding: '40px 20px 24px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 32 }}>
            <div>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.saffron }}>protago</span>
              <p style={{ fontSize: 13, marginTop: 10, lineHeight: 1.6, color: 'rgba(255,255,255,0.45)' }}>
                Magical, personalised storybooks that make every Indian child the hero of their own adventure.
              </p>
              <a href="mailto:hello@protago.in" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.gold, marginTop: 10, textDecoration: 'none' }}>
                <MessageCircle size={14} /> hello@protago.in
              </a>
              <a href="https://wa.me/919606037934" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.gold, marginTop: 8, textDecoration: 'none' }}>
                <MessageCircle size={14} /> WhatsApp: +91 96060 37934
              </a>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>Legal</h4>
              {[['Privacy Policy', '/privacy'], ['Terms & Conditions', '/terms'], ['Refund Policy', '/refund']].map(([label, href]) => (
                <div key={href} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>{label}</a>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>&copy; {new Date().getFullYear()} Protago. All rights reserved.</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Made with love in India 🇮🇳</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
