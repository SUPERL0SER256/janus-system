import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import HomePage from './pages/HomePage';
import IntroPage from './pages/IntroPage';
import VotingArena from './pages/VotingArena';
import ResultsDashboard from './pages/ResultsDashboard';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/upload" element={<HomePage />} />
      <Route path="/project/:projectId" element={<IntroPage />} />
      <Route path="/project/:projectId/vote" element={<VotingArena />} />
      <Route path="/project/:projectId/results" element={<ResultsDashboard />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
    </Routes>
  );
}