export type ReviewItem = {
  authorName: string;
  authorPhoto: string | null;
  authorUrl: string | null;
  rating: number;
  publishedAt: string; // ISO date string, e.g. "2026-05-27"
  text: string;
};

export function getRelativeTime(publishedAt: string): string {
  const now = new Date();
  const then = new Date(publishedAt);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'a day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return 'a week ago';
  if (diffDays < 21) return '2 weeks ago';
  if (diffDays < 30) return '3 weeks ago';

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'a month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return 'a year ago';
  return `${diffYears} years ago`;
}

export type ReviewData = {
  rating: number;
  userRatingCount: number;
  reviews: ReviewItem[];
};

// Single source of truth for the Google Reviews shown across the site — the landing
// page review carousel and the "while you wait" preview-generation screen both read
// from here, so they always stay in sync. Update userRatingCount / reviews here when
// new Google ratings/reviews come in.
export const GOOGLE_REVIEWS: ReviewData = {
  rating: 5.0,
  userRatingCount: 14,
  reviews: [
    { authorName: 'Hemanti Rawat',              authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/FUu8mgVqK8YBwq4t7', 
      rating: 5, publishedAt: '2026-06-03', text: 'The book is very amazing my son is 8 months old still he was very excited to see the vibrant colors, pictures of the book..' },
    { authorName: 'Namita Lohia',               authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/yp8iJU3iRBaWLcyf6', rating: 5, publishedAt: '2026-05-28', 
      text: 'Loved the little details and cute animated stories. Thanku for making it special for the little ones. 😊' },
    { authorName: 'Santanu Guha',               authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/ADq8WwzTyhNecPWg8', rating: 5, publishedAt: '2026-05-21', 
      text: 'An amazing and truly unique approach that creates personalized AI storybooks kids absolutely love. It brings so much joy and excitement to children while ' +
      'making reading more magical and engaging. Wishing Piyush and the entire team continued success—this is a wonderful product with huge potential!' },
    { authorName: 'Jyothi Niveditha Karpurapu', authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/rh4GfLz43smcnsbS6', rating: 5, publishedAt: '2026-06-03', 
      text: 'I gifted a personalised book for my nephew, and it turned out to be such a special gift! The moment he saw his name and himself as part of the story, his face' +
      ' lit up with excitement and happiness. He kept flipping through the pages, absolutely delighted.' },
    { authorName: 'Suraj Shetty',               authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/FPbMYvWQYtCyKyrW9', rating: 5, publishedAt: '2026-05-17', 
      text: 'Their custom kids book was loved by my 2 girls (8 years). They customized the book to include both sisters flying a plane together and visiting places.' +
      ' They will cherish these memories and share common experiences. Parents must have these books — an excellent gift for young ones.' },
    { authorName: 'A Learning Theme',           authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/eYrwqJNQTJb3MVz8A', rating: 5, publishedAt: '2026-05-20', 
      text: 'Such a beautiful and thoughtful gift for kids 🥹📚✨ Seeing her own name, photos & story inside the book made her genuinely so happy. Absolutely recommend!' },
    { authorName: 'Jayam Chandra',              authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/f3PkvWXtiYzLCaHP8', rating: 5, publishedAt: '2026-05-18', 
      text: 'My kid loves the book. He is so excited when he is watching his version of images on the book and is able to relate with the story better as it gives a tinge of personalization.' },
    { authorName: 'Tanya Bhardwaj',             authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/jgDvRX4ZMUeK5jsE6', rating: 5, publishedAt: '2026-05-15', 
      text: 'The book and the detailing was so amazing it even captured my pimple patch and story was wonderful. Best book ever.' },
    { authorName: 'Anjali Thapliyal',           authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/VoJVeVWYgYpk4zKcA', rating: 5, publishedAt: '2026-06-03', 
      text: 'It just a amazing book and having a great concept of baby picture' },
    { authorName: 'Ramya Lakshmi',              authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/FvpcZAXyZ8eoNUXi6', rating: 5, publishedAt: '2026-06-15', 
      text: 'Amazing edit, quality product and timely delivery !' },
    { authorName: 'Shreya Rajpal',              authorPhoto: null, authorUrl: 'https://maps.app.goo.gl/su3Q4tYVpDDmymCW6', 
      rating: 5, publishedAt: '2026-06-10', text: 'We recently started reading Protago book Maira\'s Bedtime Routines – The Dream Keeper Book 1 with my daughter, and it has quickly' +
      ' become part of our nightly routine. The story is engaging, easy for young children to follow, and carries a gentle message about bedtime habits without feeling preachy. My ' +
      'daughter especially loves the magical illustrations and often points out her favorite parts while we read together. It\'s one of those books that keeps children interested ' +
      'while also creating a calm bedtime atmosphere. A lovely read by protago AI for parents looking to make bedtime a little more enjoyable and meaningful.' },
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
};
