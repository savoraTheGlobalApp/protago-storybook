import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NavBar } from '../components/NavBar';

const API = import.meta.env.VITE_API_BASE_URL || '';

const C = {
  saffron: '#FF6B35', gold: '#F7B731', navy: '#1A1A2E',
  gray: '#555', lgray: '#999', warm: '#FFF8F3',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Reading & Literacy':       '#3B82F6',
  'Child Development':        '#8B5CF6',
  'Indian Culture':           '#F59E0B',
  'Parenting Tips':           '#10B981',
  'Education':                '#6366F1',
  'Social-Emotional Learning':'#EC4899',
  'Digital Wellness':         '#06B6D4',
};

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] || C.saffron;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: color + '18', color, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
      {category}
    </span>
  );
}

function readTime(content = '') {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

type Post = {
  id: string; slug: string; title: string; excerpt: string;
  category: string; tags: string[]; cover_image_url: string | null;
  published: boolean; published_at: string | null; created_at: string;
};

export function BlogListPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/blog?page=${page}&limit=12`)
      .then(r => r.json())
      .then(d => {
        setPosts(prev => page === 1 ? d.posts : [...prev, ...d.posts]);
        setHasMore(d.posts.length === 12);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const [featured, ...rest] = posts;

  return (
    <div style={{ background: C.warm, minHeight: '100vh' }}>
      <NavBar />

      {/* Hero */}
      <div style={{ background: C.navy, padding: '80px 20px 56px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,107,53,0.15)', color: C.saffron, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, borderRadius: 20, padding: '4px 14px', marginBottom: 18, textTransform: 'uppercase' }}>
            Protago Blog
          </div>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#fff', lineHeight: 1.1, margin: '0 0 16px' }}>
            Raising readers,<br />
            <span style={{ color: C.gold }}>one story at a time.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, margin: 0 }}>
            Parenting, child development, education — for the Indian family.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }}>
        {loading && posts.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ height: 190, background: '#F3F4F6', animation: 'pulse 1.5s infinite' }} />
                <div style={{ padding: 20 }}>
                  <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, marginBottom: 10, width: '40%' }} />
                  <div style={{ height: 20, background: '#F3F4F6', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.lgray, fontSize: 16, marginTop: 60 }}>No posts yet — check back soon!</p>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/blog/${featured.slug}`)}
                style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', flexDirection: 'column', marginBottom: 40 }}
                className="sm:flex-row">
                {featured.cover_image_url && (
                  <div style={{ flex: '0 0 42%', minHeight: 240 }}>
                    <img src={featured.cover_image_url} alt={featured.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ flex: 1, padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <CategoryBadge category={featured.category} />
                    <span style={{ fontSize: 12, color: C.lgray }}>{readTime(featured.excerpt)} min read</span>
                  </div>
                  <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', color: C.navy, lineHeight: 1.3, margin: '0 0 12px' }}>
                    {featured.title}
                  </h2>
                  <p style={{ color: C.gray, fontSize: 15, lineHeight: 1.7, margin: '0 0 20px' }}>{featured.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: C.saffron, fontWeight: 700 }}>Read article →</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {rest.map((post, i) => (
                <motion.div key={post.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  {post.cover_image_url ? (
                    <div style={{ height: 190, overflow: 'hidden' }}>
                      <img src={post.cover_image_url} alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} />
                    </div>
                  ) : (
                    <div style={{ height: 190, background: `linear-gradient(135deg, ${C.saffron}22 0%, ${C.gold}22 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                      📖
                    </div>
                  )}
                  <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CategoryBadge category={post.category} />
                      <span style={{ fontSize: 11, color: C.lgray }}>{readTime(post.excerpt)} min read</span>
                    </div>
                    <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 16, color: C.navy, lineHeight: 1.4, margin: 0 }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, margin: 0, flex: 1 }}>{post.excerpt}</p>
                    <span style={{ fontSize: 13, color: C.saffron, fontWeight: 700, marginTop: 4 }}>Read →</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <button onClick={() => setPage(p => p + 1)} disabled={loading}
                  style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 50, padding: '13px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
