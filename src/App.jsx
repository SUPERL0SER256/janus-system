import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VotingArena from './pages/VotingArena';
import ResultsDashboard from './pages/ResultsDashboard';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/project/:projectId" element={<VotingArena />} />
      <Route path="/project/:projectId/results" element={<ResultsDashboard />} />
    </Routes>
  );
}