import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
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

            return (
              <motion.button
                key={design.id}
                layoutId={`row-${design.id}`}
                onClick={() => setSelectedDesign(design)}
                className={`dash-row ${index === 0 ? 'dash-row--leader' : ''}`}
              >
                <div className="dash-rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
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
                <div className="dash-score">
                  <span className="dash-elo">{design.elo_score}</span>
                  <span className="dash-matches">{design.comparison_count} matches</span>
                </div>
              </motion.button>
            );
          })}
        </div>
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
                  <div className="dash-modal-score">
                    <span className="dash-modal-label">Elo Rating</span>
                    <span className="dash-modal-elo">{selectedDesign.elo_score}</span>
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