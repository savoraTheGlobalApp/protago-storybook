import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

type Post = {
  id: string; slug: string; title: string; excerpt: string; content: string;
  category: string; tags: string[]; cover_image_url: string | null;
  meta_description: string; author: string; published_at: string | null; created_at: string;
};

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function readTime(content = '') {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API}/api/blog/${slug}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setPost(d); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ background: C.warm, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 20px' }}>
        <div style={{ height: 380, background: '#F3F4F6', borderRadius: 24, marginBottom: 32 }} />
        {[100, 80, 95, 70].map((w, i) => (
          <div key={i} style={{ height: 16, background: '#F3F4F6', borderRadius: 8, marginBottom: 12, width: `${w}%` }} />
        ))}
      </div>
    </div>
  );

  if (notFound || !post) return (
    <div style={{ background: C.warm, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ textAlign: 'center', padding: '120px 20px' }}>
        <p style={{ fontSize: 18, color: C.lgray }}>Post not found.</p>
        <button onClick={() => navigate('/blog')} style={{ marginTop: 20, background: C.saffron, color: '#fff', border: 'none', borderRadius: 50, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>
          Back to Blog
        </button>
      </div>
    </div>
  );

  const color = CATEGORY_COLORS[post.category] || C.saffron;

  return (
    <div style={{ background: C.warm, minHeight: '100vh' }}>
      <NavBar />

      {/* Hero image */}
      {post.cover_image_url && (
        <div style={{ width: '100%', maxHeight: 440, overflow: 'hidden' }}>
          <img src={post.cover_image_url} alt={post.title}
            style={{ width: '100%', height: 440, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px 96px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Back */}
          <button onClick={() => navigate('/blog')}
            style={{ background: 'none', border: 'none', color: C.saffron, fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← All Articles
          </button>

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: color + '18', color, borderRadius: 20, padding: '3px 10px' }}>
              {post.category}
            </span>
            <span style={{ fontSize: 13, color: C.lgray }}>{formatDate(post.published_at || post.created_at)}</span>
            <span style={{ fontSize: 13, color: C.lgray }}>·</span>
            <span style={{ fontSize: 13, color: C.lgray }}>{readTime(post.content)} min read</span>
            <span style={{ fontSize: 13, color: C.lgray }}>·</span>
            <span style={{ fontSize: 13, color: C.lgray }}>By {post.author}</span>
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 900, fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: C.navy, lineHeight: 1.2, margin: '0 0 24px' }}>
            {post.title}
          </h1>

          {/* Excerpt */}
          <p style={{ fontSize: 18, color: C.gray, lineHeight: 1.7, margin: '0 0 36px', borderLeft: `3px solid ${C.gold}`, paddingLeft: 18, fontStyle: 'italic' }}>
            {post.excerpt}
          </p>

          {/* Body */}
          <div className="blog-content"
            style={{ fontSize: 16, color: '#333', lineHeight: 1.85 }}
            dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 40, paddingTop: 32, borderTop: '1px solid #E5E7EB' }}>
              {post.tags.map(tag => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 600, background: '#F3F4F6', color: C.gray, borderRadius: 20, padding: '4px 12px' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{ background: C.navy, borderRadius: 20, padding: '32px 36px', marginTop: 48, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 8px' }}>Want to make your child the hero?</p>
            <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', margin: '0 0 20px' }}>
              Create a personalised storybook for your child today.
            </p>
            <a href="/#themes" style={{ display: 'inline-block', background: C.saffron, color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 15, borderRadius: 50, padding: '13px 32px', fontFamily: "'Baloo 2', sans-serif" }}>
              Explore Themes →
            </a>
          </div>

        </motion.div>
      </div>

      {/* Blog content styles */}
      <style>{`
        .blog-content h2 { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 1.35rem; color: ${C.navy}; margin: 2em 0 0.6em; }
        .blog-content p  { margin: 0 0 1.3em; }
        .blog-content ul, .blog-content ol { margin: 0 0 1.3em 1.5em; }
        .blog-content li { margin-bottom: 0.4em; }
        .blog-content strong { color: ${C.navy}; }
        .blog-disclaimer { background: #FFF8F3; border: 1.5px solid #FFD9C5; border-radius: 12px; padding: 16px 20px; margin-top: 40px; font-size: 13px; color: #666; line-height: 1.6; }
        .blog-disclaimer strong { color: ${C.saffron}; }
      `}</style>
    </div>
  );
}
