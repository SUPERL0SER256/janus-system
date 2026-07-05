import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useImagePrefetch } from '../useImagePrefetch';
import './VotingArena.css';

const VOTE_COOLDOWN_MS = 500; 

export default function VotingArena() {
  const { projectId } = useParams();
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const lastVoteTime = useRef(0);

  useEffect(() => {
    const fetchDesigns = async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('project_id', projectId);

      if (!error && data?.length > 1) {
        const initialQueue = Array.from({ length: 20 }, () => {
          let idxA = Math.floor(Math.random() * data.length);
          let idxB = Math.floor(Math.random() * data.length);
          while (idxA === idxB) idxB = Math.floor(Math.random() * data.length);
          return [data[idxA], data[idxB]];
        });
        setQueue(initialQueue);
      }
      setIsLoading(false);
    };
    fetchDesigns();
  }, [projectId]);

  const currentPair = queue[0];
  const nextPair = queue[1];
  useImagePrefetch(nextPair ? [nextPair[0].image_url, nextPair[1].image_url] : []);

  const handleVote = (winner, loser) => {
    const now = Date.now();

    if (now - lastVoteTime.current < VOTE_COOLDOWN_MS) return;
    lastVoteTime.current = now;

    setIsCoolingDown(true);
    setTimeout(() => setIsCoolingDown(false), VOTE_COOLDOWN_MS);

    setQueue((prev) => prev.slice(1));

    supabase.rpc('record_elo_vote', {
      winner_id: winner.id,
      loser_id: loser.id,
      current_project_id: projectId
    }).then(({ error }) => {
      if (error) console.error('Failed to sync vote:', error);
    });
  };

  if (isLoading) return (
    <div className="arena-loading">Loading...</div>
  );

  if (!currentPair) return (
    <div className="arena-loading">
      <p>All done!</p>
      <Link to={`/project/${projectId}/results`} className="arena-done-link">View Results</Link>
    </div>
  );

  return (
    <div className="arena-page">
      <header className="arena-header">
        <Link to="/" className="arena-logo">The 'Janus System'</Link>
        <span className="arena-remaining">{queue.length} remaining</span>
      </header>

      <main className="arena-main">
        <h1 className="arena-prompt">Which do you prefer?</h1>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentPair[0].id + currentPair[1].id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="arena-pair"
          >
            {currentPair.map((option, index) => {
              const opponent = currentPair[index === 0 ? 1 : 0];
              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option, opponent)}
                  disabled={isCoolingDown}
                  className={`arena-card ${isCoolingDown ? 'arena-card--cooldown' : ''}`}
                >
                  <div className="arena-img-wrap">
                    <img src={option.image_url} alt={option.name} className="arena-img" />
                  </div>
                  <div className="arena-card-footer">
                    <span className="arena-card-name">{option.name}</span>
                    <span className="arena-card-cta">Select</span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <Link to={`/project/${projectId}/results`} className="arena-stop-btn">
          Stop Voting
        </Link>
      </main>
    </div>
  );
}