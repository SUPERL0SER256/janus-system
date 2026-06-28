// src/pages/VotingArena.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useImagePrefetch } from '../useImagePrefetch';

export default function VotingArena() {
  const { projectId } = useParams();
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the queue by generating a long list of random pairs
  useEffect(() => {
    const fetchDesigns = async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('project_id', projectId);

      if (!error && data?.length > 1) {
        // Generate a queue of 20 random matchups to start
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

  // Prefetch the next pair of images so they appear instantly
  useImagePrefetch(nextPair ? [nextPair[0].image_url, nextPair[1].image_url] : []);

  const handleVote = (winner, loser) => {
    // 1. Optimistic UI Update: Instantly move to the next pair
    setQueue((prevQueue) => prevQueue.slice(1));

    // 2. Background Database Sync: Fire and forget to the RPC engine
    supabase.rpc('record_elo_vote', {
      winner_id: winner.id,
      loser_id: loser.id,
      current_project_id: projectId
    }).catch(err => {
      console.error("Failed to sync vote:", err);
    });
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white/30 font-light tracking-widest uppercase">Initializing...</div>;
  if (!currentPair) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="text-white/50 font-light tracking-widest uppercase">Arena Concluded</div>
      <Link to={`/project/${projectId}/results`} className="liquid-glass px-6 py-3 rounded-xl text-white/90 text-sm tracking-wide hover:bg-white/5">View Results</Link>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-screen w-full overflow-hidden">
      <header className="absolute top-8 left-8 flex items-baseline gap-4">
        <span className="text-xl tracking-[0.2em] font-light text-white/80">JANUS</span>
        <span className="text-xs font-mono text-white/20 uppercase">ID: {projectId.split('-')[0]}</span>
      </header>

      <div className="w-full max-w-5xl flex flex-col items-center gap-12 mt-8 relative">
        <h1 className="text-2xl md:text-3xl font-light tracking-wide text-white/80">Select preferred iteration</h1>

        {/* The Arena Frame */}
        <div className="relative w-full flex justify-center items-center h-[50vh] md:h-[60vh] max-h-[600px]">
          <AnimatePresence mode="popLayout">
            <motion.div 
              key={currentPair[0].id + currentPair[1].id} // Unique key per matchup forces animation
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute w-full h-full flex flex-col md:flex-row gap-6 md:gap-8"
            >
              {currentPair.map((option, index) => {
                const opponent = currentPair[index === 0 ? 1 : 0];
                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option, opponent)}
                    className="group relative flex-1 liquid-glass liquid-glass-interactive rounded-[2rem] overflow-hidden flex flex-col p-4 w-full h-full text-left focus:outline-none"
                  >
                    <div className="w-full h-full rounded-[1.25rem] overflow-hidden bg-black/40">
                      <img 
                        src={option.image_url} 
                        alt={option.name} 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                      />
                    </div>
                    <div className="w-full flex justify-between items-center mt-4 px-2 pb-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm tracking-wide font-light truncate">{option.name}</span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}