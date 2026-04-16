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
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BrochurePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/themes" element={<Navigate to="/" replace />} />
        <Route path="/explore" element={<Storybook />} />
        <Route path="/create/:bookSlug" element={<StorybookCreate />} />
        <Route path="/theme/:slug" element={<ThemePage />} />
        <Route path="/preview/:jobId" element={<PreviewResultPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund" element={<RefundPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/order-confirmed" element={<OrderConfirmedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
