import { Routes, Route } from 'react-router-dom';
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
      <Route path="/" element={<HomePage />} />
      <Route path="/project/:projectId" element={<IntroPage />} />
      <Route path="/project/:projectId/vote" element={<VotingArena />} />
      <Route path="/project/:projectId/results" element={<ResultsDashboard />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
    </Routes>
  );
}