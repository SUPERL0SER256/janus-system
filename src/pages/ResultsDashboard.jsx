import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import './ResultsDashboard.css';

export default function ResultsDashboard() {
  const { projectId } = useParams();
  const [designs, setDesigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const latestDesignsRef = useRef([]);
  const hasPendingUpdates = useRef(false);

  useEffect(() => {
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('project_id', projectId)
        .order('elo_score', { ascending: false });
      if (!error && data) {
        setDesigns(data);
        latestDesignsRef.current = data;
      }
      setIsLoading(false);
    };
    fetchResults();

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'images', filter: `project_id=eq.${projectId}` },
        (payload) => {
          const updated = latestDesignsRef.current.map(d =>
            d.id === payload.new.id ? payload.new : d
          );
          latestDesignsRef.current = updated.sort((a, b) => b.elo_score - a.elo_score);
          hasPendingUpdates.current = true;
        }
      ).subscribe();

    const throttleInterval = setInterval(() => {
      if (hasPendingUpdates.current) {
        setDesigns([...latestDesignsRef.current]);
        hasPendingUpdates.current = false;
      }
    }, 500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(throttleInterval);
    };
  }, [projectId]);

  if (isLoading) return (
    <div className="dash-loading">Loading results...</div>
  );

  const maxElo = designs.length ? designs[0].elo_score : 1200;
  const minElo = designs.length ? designs[designs.length - 1].elo_score : 1200;
  const eloRange = maxElo - minElo || 1;

  const totalComparisons = designs.reduce((sum, d) => sum + d.comparison_count, 0);
  let stdDev = 0;
  if (designs.length > 0) {
    const meanElo = designs.reduce((sum, d) => sum + d.elo_score, 0) / designs.length;
    const variance = designs.reduce((sum, d) => sum + Math.pow(d.elo_score - meanElo, 2), 0) / designs.length;
    stdDev = Math.round(Math.sqrt(variance));
  }
  let consensusLabel = "Head to Head";
  if (stdDev > 150) {
    consensusLabel = "Clear Winners";
  } else if (stdDev >= 50) {
    consensusLabel = "Moderate";
  }

  return (
    <div className="dash-page">
      <header className="dash-header">
        <Link to="/" className="dash-logo">The 'Janus System'</Link>
        <div className="dash-live">
          <span className="dash-live-dot"></span>
          Live
        </div>
      </header>

      <main className="dash-main">
        <h2 className="dash-section-title">Rankings</h2>

        <div className="dash-list">
          {designs.map((design, index) => {
            const barWidth = Math.round(((design.elo_score - minElo) / eloRange) * 80 + 20);
            const winRate = Math.round((1 / (1 + Math.pow(10, (1200 - design.elo_score) / 400))) * 100);
            const deviation = design.elo_score - 1200;
            const deviationStr = deviation > 0 ? `+${deviation}` : `${deviation}`;
            const devClass = deviation > 0 ? 'pos' : (deviation < 0 ? 'neg' : '');

            return (
              <motion.button
                key={design.id}
                layoutId={`row-${design.id}`}
                onClick={() => setSelectedDesign(design)}
                className={`dash-row ${index === 0 ? 'dash-row--leader' : ''}`}
              >
                <div className="dash-rank">
                  {index === 0 ? '#1' : index === 1 ? '#2' : index === 2 ? '#3' : `#${index + 1}`}
                </div>
                <div className="dash-thumb">
                  <img src={design.image_url} alt={design.name} />
                </div>
                <div className="dash-info">
                  <span className="dash-name">{design.name}</span>
                  <div className="dash-bar-track">
                    <div className="dash-bar-fill" style={{ width: `${barWidth}%` }}></div>
                  </div>
                </div>
                <div className="dash-score-ext">
                  <div className={`dash-dev ${devClass}`}>{deviationStr}</div>
                  <div className="dash-winrate">{winRate}% Win Rate</div>
                </div>
                <div className="dash-score">
                  <span className="dash-elo">{design.elo_score}</span>
                  <span className="dash-matches">{design.comparison_count} matches</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <h2 className="dash-section-title" style={{ marginTop: '3rem' }}>Project Summary</h2>
        <div className="dash-summary">
          <div className="dash-summary-stat">
            <span className="dash-summary-label">Total Matches</span>
            <span className="dash-summary-val">{Math.floor(totalComparisons / 2)}</span>
          </div>
          <div className="dash-summary-stat">
            <span className="dash-summary-label">Score Spread</span>
            <span className="dash-summary-val">±{stdDev}</span>
          </div>
          <div className="dash-summary-stat">
            <span className="dash-summary-label">Consensus</span>
            <span className="dash-summary-val">{consensusLabel}</span>
          </div>
        </div>

        {designs.length > 0 && (
          <>
            <h2 className="dash-section-title" style={{ marginTop: '1rem' }}>Performance vs Baseline</h2>
            <div className="dash-chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={designs.map(d => ({
                name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
                elo: d.elo_score
              }))} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="achromaticGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0c0e0c" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#4b5563" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 50', 'dataMax + 50']} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />

                <ReferenceLine y={1200} stroke="#18181b" strokeDasharray="3 3" />
                <Bar dataKey="elo" radius={[0, 0, 0, 0]} maxBarSize={40} fill="url(#achromaticGradient)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <h2 className="dash-section-title" style={{ marginTop: '1rem' }}>Score vs Exposure</h2>
          <div className="dash-chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <defs>
                  <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis type="number" dataKey="matches" name="Matches" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="elo" name="Elo Score" domain={['dataMin - 50', 'dataMax + 50']} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <ZAxis type="category" dataKey="name" name="Design" />
                <Scatter data={designs.map(d => ({
                  name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
                  elo: d.elo_score,
                  matches: d.comparison_count
                }))} fill="#656e7b" filter="url(#dotGlow)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {selectedDesign && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDesign(null)}
              className="dash-overlay"
            />
            <div className="dash-modal-wrap">
              <motion.div
                layoutId={`row-${selectedDesign.id}`}
                className="dash-modal"
              >
                <img src={selectedDesign.image_url} alt={selectedDesign.name} className="dash-modal-img" />
                <div className="dash-modal-body">
                  <div>
                    <h2 className="dash-modal-name">{selectedDesign.name}</h2>
                    <p className="dash-modal-sub">{selectedDesign.comparison_count} total matches</p>
                  </div>
                  <div className="dash-modal-stats-wrap">
                    <div className="dash-modal-score">
                      <span className="dash-modal-label">Win Rate</span>
                      <span className="dash-modal-elo">{Math.round((1 / (1 + Math.pow(10, (1200 - selectedDesign.elo_score) / 400))) * 100)}%</span>
                    </div>
                    <div className="dash-modal-score">
                      <span className="dash-modal-label">Elo Rating</span>
                      <span className="dash-modal-elo">{selectedDesign.elo_score}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedDesign(null)} className="dash-modal-close">✕</button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}