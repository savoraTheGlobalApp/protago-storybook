import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Storybook } from './pages/Storybook';
import { StorybookCreate } from './pages/StorybookCreate';
import { BrochurePage } from './pages/BrochurePage';
import { PreviewResultPage } from './pages/PreviewResultPage';
import { ThemePage } from './pages/ThemePage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RefundPage } from './pages/RefundPage';
import { ContactPage } from './pages/ContactPage';
import { OrderConfirmedPage } from './pages/OrderConfirmedPage';
import { BlogListPage } from './pages/BlogListPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { BlogAdminPage } from './pages/BlogAdminPage';
import { CustomStoryPage } from './pages/CustomStoryPage';

function SocialFloats() {
  const btnStyle = (bg: string, shadow: string): React.CSSProperties => ({
    width: 52, height: 52, borderRadius: '50%', background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 4px 20px ${shadow}`, transition: 'transform 0.2s, box-shadow 0.2s',
    textDecoration: 'none',
  });
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <a href="https://wa.me/919606037934" target="_blank" rel="noopener noreferrer"
        style={btnStyle('#25D366', 'rgba(37,211,102,0.45)')}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}
        title="Chat with us on WhatsApp">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
      <a href="https://www.instagram.com/protago.in/" target="_blank" rel="noopener noreferrer"
        style={btnStyle('linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', 'rgba(220,39,67,0.45)')}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}
        title="Follow us on Instagram">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
        </svg>
      </a>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <SocialFloats />
      <Routes>
        <Route path="/" element={<BrochurePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/themes" element={<Navigate to="/?scroll=themes" replace />} />
        <Route path="/explore" element={<Storybook />} />
        <Route path="/create/:bookSlug" element={<StorybookCreate />} />
        <Route path="/theme/:slug" element={<ThemePage />} />
        <Route path="/preview/:jobId" element={<PreviewResultPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund" element={<RefundPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/order-confirmed" element={<OrderConfirmedPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/admin/blog" element={<BlogAdminPage />} />
        <Route path="/custom-story" element={<CustomStoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
