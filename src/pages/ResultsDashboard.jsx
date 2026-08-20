import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie } from 'recharts';
import './ResultsDashboard.css';

export default function ResultsDashboard() {
  const { projectId } = useParams();
  const [designs, setDesigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [project, setProject] = useState(null);
  const latestDesignsRef = useRef([]);
  const hasPendingUpdates = useRef(false);

  const isCreator = (() => {
    try {
      const creatorProjects = JSON.parse(localStorage.getItem('janus_creator_projects') || '[]');
      return creatorProjects.includes(projectId);
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    const fetchResults = async () => {
      const [{ data: projectData }, { data: imagesData, error }] = await Promise.all([
        supabase.from('projects').select('title, description').eq('id', projectId).single(),
        supabase.from('images').select('*').eq('project_id', projectId).order('elo_score', { ascending: false })
      ]);
      
      if (projectData) setProject(projectData);

      if (!error && imagesData) {
        setDesigns(imagesData);
        latestDesignsRef.current = imagesData;
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

  const n = designs.length;
  const totalMatches = Math.floor(totalComparisons / 2);
  const totalPairs = (n * (n - 1)) / 2;
  const averageVotesPerUser = totalPairs > 0 ? Math.min(totalPairs, 4 + n) : 1;
  const estimatedVoters = totalMatches === 0 ? 0 : Math.ceil(totalMatches / averageVotesPerUser);

  return (
    <div className={`dash-page ${isDarkMode ? 'dash-dark' : ''}`}>
      <header className="dash-header">
        <Link to="/" className="dash-logo">The Janus System</Link>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.02em' }}>
          Results Dashboard
        </div>
      </header>

      <main className="dash-main">
        {/* SEO Thin Content Fix */}
        <div className="sr-only">
          Welcome to the Janus System Results Dashboard. Here you can view the live Elo rankings, win rates, and total matches for each design iteration in this project. Our collaborative decision engine eliminates choice paralysis by crowdsourcing pairwise feedback.
        </div>

        {/* Project context shown at top */}
        <div className="dash-context" style={{ marginBottom: '2rem' }}>
          {project?.title ? (
            <h1 className="dash-context-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: isDarkMode ? '#fff' : '#18181b', fontWeight: 700 }}>{project.title}</h1>
          ) : (
            <h1 className="sr-only">Project Results Dashboard</h1>
          )}
          {project?.description && <p className="dash-context-desc" style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#6b7280', lineHeight: 1.5 }}>{project.description}</p>}
        </div>

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
                className="dash-row"
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
                {isCreator && (
                  <div className="dash-score-ext">
                    <div className={`dash-dev ${devClass}`}>{deviationStr}</div>
                    <div className="dash-winrate">{winRate}% Win Rate</div>
                  </div>
                )}
                <div className="dash-score">
                  <span className="dash-elo">{design.elo_score}</span>
                  <span className="dash-matches">{design.comparison_count} matches</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {isCreator && (
          <>
            <h2 className="dash-section-title" style={{ marginTop: '3rem' }}>Project Summary</h2>
            <div className="dash-summary">
              <div className="dash-summary-stat">
                <span className="dash-summary-label">Total Matches</span>
                <span className="dash-summary-val">{totalMatches}</span>
              </div>
              <div className="dash-summary-stat">
                <span className="dash-summary-label">Estimated Voters</span>
                <span className="dash-summary-val">{estimatedVoters}</span>
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
          </>
        )}

        {isCreator && designs.length > 0 && (
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
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 50', 'dataMax + 50']} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />

                <ReferenceLine y={1200} stroke="#ffffff" strokeDasharray="3 3" />
                <Bar dataKey="elo" radius={[0, 0, 0, 0]} maxBarSize={40} fill="url(#achromaticGradient)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <h2 className="dash-section-title" style={{ marginTop: '1rem' }}>Win Probability Share</h2>
          <div className="dash-chart-container" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: '1 1 50%' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={designs.map(d => ({
                      name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
                      winRate: Math.round((1 / (1 + Math.pow(10, (1200 - d.elo_score) / 400))) * 100)
                    }))}
                    dataKey="winRate"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={0}
                    stroke="none"
                  >
                    {designs.map((entry, index) => {
                      const sortedIds = [...designs].map(d => d.id).sort();
                      const colorList = ['#ffffff', '#d1d5db', '#9ca3af', '#4b5563', '#374151', '#2dd4bf', '#818cf8', '#f472b6'];
                      const color = colorList[sortedIds.indexOf(entry.id) % colorList.length];
                      return <Cell key={`cell-${entry.id}`} fill={color} />
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: '1 1 50%', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {designs.map((d, index) => {
                const sortedIds = [...designs].map(design => design.id).sort();
                const colorList = ['#ffffff', '#d1d5db', '#9ca3af', '#4b5563', '#374151', '#2dd4bf', '#818cf8', '#f472b6'];
                const color = colorList[sortedIds.indexOf(d.id) % colorList.length];
                const winRate = Math.round((1 / (1 + Math.pow(10, (1200 - d.elo_score) / 400))) * 100);
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></div>
                    <span style={{ color: '#fff', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.name}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontWeight: 600 }}>
                      {winRate}%
                    </span>
                  </div>
                );
              })}
            </div>
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