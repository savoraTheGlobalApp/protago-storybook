import { useNavigate } from 'react-router-dom';

const C = {
  saffron: '#FF6B35',
  gold: '#F7B731',
  navy: '#1A1A2E',
  white: '#FFFFFF',
};

export function PolicyLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: C.white, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: C.navy }} className="px-6 py-5 flex items-center gap-6">
        <button onClick={() => navigate('/home')} className="text-sm hover:opacity-70 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.5)' }}>← Back</button>
        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.saffron }}>
          protago
        </span>
      </div>

      {/* Hero bar */}
      <div style={{ background: `linear-gradient(135deg, ${C.saffron} 0%, ${C.gold} 100%)` }} className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.white }}
            className="text-3xl sm:text-4xl">{title}</h1>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose prose-lg" style={{ color: '#333', lineHeight: 1.8 }}>
          {children}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: C.navy }} className="px-6 py-6 text-center">
        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 18, color: C.saffron }}>protago</span>
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          &copy; {new Date().getFullYear()} Protago · Made with love in India 🇮🇳
        </p>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, color: '#1A1A2E' }}
        className="text-xl mb-3">{title}</h2>
      <div style={{ color: '#444', lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}
