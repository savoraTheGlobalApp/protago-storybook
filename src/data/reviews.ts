export type ReviewItem = {
  authorName: string;
  authorPhoto: string | null;
  authorUrl: string | null;
  rating: number;
  relativeTime: string;
  text: string;
};

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
    { authorName: 'Hemanti Rawat',              authorPhoto: null, authorUrl: null, rating: 5, relativeTime: '3 days ago',   text: 'The book is very amazing my son is 8 months old still he was very excited to see the vibrant colors, pictures of the book..' },
    { authorName: 'Namita Lohia',               authorPhoto: null, authorUrl: null, rating: 5, relativeTime: 'a week ago',   text: 'Loved the little details and cute animated stories. Thanku for making it special for the little ones. 😊' },
    { authorName: 'Santanu Guha',               authorPhoto: null, authorUrl: null, rating: 5, relativeTime: '2 weeks ago',  text: 'An amazing and truly unique approach that creates personalized AI storybooks kids absolutely love. It brings so much joy and excitement to children while making reading more magical and engaging. Wishing Piyush and the entire team continued success—this is a wonderful product with huge potential!' },
    { authorName: 'Jyothi Niveditha Karpurapu', authorPhoto: null, authorUrl: null, rating: 5, relativeTime: '2 weeks ago',  text: 'I gifted a personalised book for my nephew, and it turned out to be such a special gift! The moment he saw his name and himself as part of the story, his face lit up with excitement and happiness. He kept flipping through the pages, absolutely delighted.' },
    { authorName: 'Suraj Shetty',               authorPhoto: null, authorUrl: null, rating: 5, relativeTime: '3 weeks ago',  text: 'Their custom kids book was loved by my 2 girls (8 years). They customized the book to include both sisters flying a plane together and visiting places. They will cherish these memories and share common experiences. Parents must have these books — an excellent gift for young ones.' },
    { authorName: 'A Learning Theme',           authorPhoto: null, authorUrl: null, rating: 5, relativeTime: '3 weeks ago',  text: 'Such a beautiful and thoughtful gift for kids 🥹📚✨ Seeing her own name, photos & story inside the book made her genuinely so happy. Absolutely recommend!' },
    { authorName: 'Jayam Chandra',              authorPhoto: null, authorUrl: null, rating: 5, relativeTime: '3 weeks ago',  text: 'My kid loves the book. He is so excited when he is watching his version of images on the book and is able to relate with the story better as it gives a tinge of personalization.' },
    { authorName: 'Tanya Bhardwaj',             authorPhoto: null, authorUrl: null, rating: 5, relativeTime: '3 weeks ago',  text: 'The book and the detailing was so amazing it even captured my pimple patch and story was wonderful. Best book ever.' },
  ],
};
