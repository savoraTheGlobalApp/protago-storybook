import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL || '';

const C = { saffron: '#FF6B35', gold: '#F7B731', navy: '#1A1A2E', gray: '#555', lgray: '#999' };

const CATEGORY_COLORS: Record<string, string> = {
  'Reading & Literacy':       '#3B82F6',
  'Child Development':        '#8B5CF6',
  'Indian Culture':           '#F59E0B',
  'Parenting Tips':           '#10B981',
  'Education':                '#6366F1',
  'Social-Emotional Learning':'#EC4899',
  'Digital Wellness':         '#06B6D4',
};

type Topic = { index: number; title: string; category: string };
type Post = {
  id: string; slug: string; title: string; excerpt: string; category: string;
  published: boolean; published_at: string | null; created_at: string; cover_image_url: string | null;
};

export function BlogAdminPage() {
  const [params] = useSearchParams();
  const secret = params.get('secret') || '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPosts = () => {
    setLoading(true);
    fetch(`${API}/api/blog?secret=${secret}&limit=50`)
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!secret) return;
    fetchPosts();
    fetch(`${API}/api/blog/topics?secret=${secret}`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setTopics(d));
  }, [secret]);

  if (!secret) return (
    <div style={{ minHeight: '100vh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Add <code style={{ color: C.gold }}>?secret=YOUR_SECRET</code> to the URL.</p>
    </div>
  );

  const generate = async () => {
    setGenerating(true); setGenError(''); setGenSuccess('');
    try {
      const res = await fetch(`${API}/api/blog/generate?secret=${secret}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTopic !== '' ? { topicIndex: selectedTopic } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGenSuccess(`Draft created: "${data.post.title}"`);
      setSelectedTopic('');
      fetchPosts();
    } catch (e: any) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggle = async (post: Post) => {
    setActionId(post.id);
    try {
      await fetch(`${API}/api/blog/${post.id}?secret=${secret}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      });
      fetchPosts();
    } finally { setActionId(null); }
  };

  const remove = async (post: Post) => {
    if (!confirm(`Delete "${post.title}"?`)) return;
    setActionId(post.id);
    try {
      await fetch(`${API}/api/blog/${post.id}?secret=${secret}`, { method: 'DELETE' });
      fetchPosts();
    } finally { setActionId(null); }
  };

  const drafts    = posts.filter(p => !p.published);
  const published = posts.filter(p => p.published);

  // Group topics by category for the dropdown
  const topicsByCategory = topics.reduce<Record<string, Topic[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: '#0F0E1A', color: '#fff', fontFamily: "'Baloo 2', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 4px' }}>Blog Admin</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 14 }}>
            {drafts.length} drafts · {published.length} published
          </p>
        </div>

        {/* Generate panel */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '20px 24px', marginBottom: 36 }}>
          <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Generate new post</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <select
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '11px 14px', color: selectedTopic === '' ? 'rgba(255,255,255,0.35)' : '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
              >
                <option value="" style={{ background: '#1A1A2E', color: 'rgba(255,255,255,0.5)' }}>✨ Pick a topic (or leave random)</option>
                {Object.entries(topicsByCategory).map(([cat, items]) => (
                  <optgroup key={cat} label={cat} style={{ background: '#1A1A2E', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                    {items.map(t => (
                      <option key={t.index} value={t.index} style={{ background: '#1A1A2E', color: '#fff' }}>
                        {t.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedTopic !== '' && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: CATEGORY_COLORS[topics[selectedTopic as number]?.category] || C.gold }}>
                  {topics[selectedTopic as number]?.category}
                </p>
              )}
            </div>
            <button onClick={generate} disabled={generating}
              style={{ background: generating ? '#555' : C.saffron, color: '#fff', border: 'none', borderRadius: 50, padding: '12px 28px', fontWeight: 800, fontSize: 15, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {generating ? '⏳ Generating…' : selectedTopic !== '' ? '✦ Generate This Topic' : '✦ Generate Random'}
            </button>
          </div>
          {generating && (
            <p style={{ margin: '12px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Writing article + generating cover image… this takes ~30 seconds.
            </p>
          )}
        </div>

        {/* Status messages */}
        {genSuccess && <div style={{ background: '#0D2E1A', border: '1px solid #22C55E', borderRadius: 12, padding: '12px 18px', marginBottom: 24, color: '#4ADE80', fontSize: 14 }}>✓ {genSuccess}</div>}
        {genError   && <div style={{ background: '#2E0D0D', border: '1px solid #EF4444', borderRadius: 12, padding: '12px 18px', marginBottom: 24, color: '#FCA5A5', fontSize: 14 }}>✗ {genError}</div>}

        {/* Drafts */}
        {drafts.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Drafts ({drafts.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {drafts.map(post => <PostRow key={post.id} post={post} secret={secret} busy={actionId === post.id} onToggle={toggle} onDelete={remove} />)}
            </div>
          </section>
        )}

        {/* Published */}
        {published.length > 0 && (
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#4ADE80', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Published ({published.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {published.map(post => <PostRow key={post.id} post={post} secret={secret} busy={actionId === post.id} onToggle={toggle} onDelete={remove} />)}
            </div>
          </section>
        )}

        {loading && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 60 }}>Loading posts…</p>}
        {!loading && posts.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 60 }}>No posts yet. Generate your first one!</p>}
      </div>
    </div>
  );
}

function PostRow({ post, secret, busy, onToggle, onDelete }: {
  post: Post; secret: string; busy: boolean;
  onToggle: (p: Post) => void; onDelete: (p: Post) => void;
}) {
  const date = new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {post.cover_image_url && (
        <img src={post.cover_image_url} alt="" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, background: post.published ? '#0D2E1A' : '#2A1A0A', color: post.published ? '#4ADE80' : C.gold, borderRadius: 20, padding: '2px 10px' }}>
            {post.published ? 'Published' : 'Draft'}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{post.category}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>· {date}</span>
        </div>
        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{post.excerpt}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <a href={`/blog/${post.slug}${!post.published ? `?secret=${secret}` : ''}`} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 12px', textDecoration: 'none' }}>
          Preview ↗
        </a>
        <button onClick={() => onToggle(post)} disabled={busy}
          style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: post.published ? '#374151' : '#15803D', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          {busy ? '…' : post.published ? 'Unpublish' : 'Publish'}
        </button>
        <button onClick={() => onDelete(post)} disabled={busy}
          style={{ fontSize: 13, color: '#FCA5A5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          Delete
        </button>
      </div>
    </div>
  );
}
