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
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const lastVoteTime = useRef(0);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: projectData }, { data: images, error }] = await Promise.all([
        supabase.from('projects').select('title, description').eq('id', projectId).single(),
        supabase.from('images').select('*').eq('project_id', projectId)
      ]);

      if (projectData) setProject(projectData);

      if (!error && images?.length > 1) {
        const allPairs = [];
        for (let i = 0; i < images.length; i++) {
          for (let j = i + 1; j < images.length; j++) {
            // Randomize left/right presentation
            if (Math.random() > 0.5) {
              allPairs.push([images[i], images[j]]);
            } else {
              allPairs.push([images[j], images[i]]);
            }
          }
        }
        
        // Shuffle the pairs (Fisher-Yates)
        for (let i = allPairs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allPairs[i], allPairs[j]] = [allPairs[j], allPairs[i]];
        }
        
        setQueue(allPairs);
      }
      setIsLoading(false);
    };
    fetchData();
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

  if (isLoading) return <div className="arena-loading">Loading...</div>;

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
        {/* Project context shown while voting */}
        {(project?.title || project?.description) && (
          <div className="arena-context">
            {project.title && <h2 className="arena-context-title">{project.title}</h2>}
            {project.description && <p className="arena-context-desc">{project.description}</p>}
          </div>
        )}

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