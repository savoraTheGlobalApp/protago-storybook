import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Storybook } from './pages/Storybook';
import { StorybookCreate } from './pages/StorybookCreate';
import { BrochurePage } from './pages/BrochurePage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Storybook />} />
        <Route path="/home" element={<BrochurePage />} />
        <Route path="/create/:bookSlug" element={<StorybookCreate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
