import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function ResultsDashboard() {
  const { projectId } = useParams();
  
  // React State (Triggers expensive UI re-renders)
  const [designs, setDesigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);

  // Silent Buffers (Updates instantly without freezing the UI)
  const latestDesignsRef = useRef([]);
  const hasPendingUpdates = useRef(false);

  useEffect(() => {
    // 1. Fetch Initial Data
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('project_id', projectId)
        .order('elo_score', { ascending: false });

      if (!error && data) {
        setDesigns(data);
        latestDesignsRef.current = data; // Populate the buffer
      }
      setIsLoading(false);
    };

    fetchResults();

    // 2. High-Speed Network Listener (Updates the silent buffer)
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'images', filter: `project_id=eq.${projectId}` },
        (payload) => {
          // Update the background ref instantly
          const current = latestDesignsRef.current;
          const updated = current.map(design => 
            design.id === payload.new.id ? payload.new : design
          );
          
          latestDesignsRef.current = updated.sort((a, b) => b.elo_score - a.elo_score);
          hasPendingUpdates.current = true; // Flag that new data is waiting
        }
      )
      .subscribe();

    // 3. The Throttle Loop (Syncs the buffer to the UI twice a second)
    const throttleInterval = setInterval(() => {
      if (hasPendingUpdates.current) {
        // Spread operator [...] creates a new array reference so React knows to re-render
        setDesigns([...latestDesignsRef.current]); 
        hasPendingUpdates.current = false;
      }
    }, 500); // 500ms delay = max 2 re-renders per second

    // Cleanup function when the user leaves the page
    return () => {
      supabase.removeChannel(channel);
      clearInterval(throttleInterval);
    };
  }, [projectId]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white/30 font-light tracking-widest uppercase">Compiling Analytics...</div>;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="liquid-glass p-4 rounded-xl border border-white/10 shadow-2xl">
          <p className="text-white/90 font-light text-sm mb-1">{payload[0].payload.name}</p>
          <p className="text-amber-500 font-mono text-xs uppercase tracking-widest">
            Rating: {payload[0].value}
          </p>
          <p className="text-white/40 font-mono text-[10px] mt-2 uppercase">
            {payload[0].payload.comparison_count} Matches
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center p-6 min-h-screen w-full relative">
      <header className="w-full max-w-6xl flex justify-between items-center mt-4 mb-12">
        <div className="flex items-baseline gap-4">
          <Link to="/" className="text-xl tracking-[0.2em] font-light text-white/80 hover:text-white transition-colors">JANUS</Link>
          <span className="text-xs font-mono text-white/20 uppercase">Live Telemetry</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Live</span>
        </div>
      </header>

      <div className="w-full max-w-6xl flex flex-col gap-12">
        
        <div className="liquid-glass w-full p-6 md:p-10 rounded-[2rem] flex flex-col gap-6 h-[400px]">
          <h2 className="text-sm font-mono text-white/40 uppercase tracking-widest">Elo Distribution</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={designs} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }} 
                dy={10}
              />
              <YAxis 
                domain={['dataMin - 50', 'dataMax + 50']} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="elo_score" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {designs.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(255, 255, 255, 0.1)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full">
          <h2 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-6">Iteration Matrix</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {designs.map((design, index) => (
              <motion.button
                key={design.id}
                layoutId={`card-container-${design.id}`}
                onClick={() => setSelectedDesign(design)}
                className={`liquid-glass liquid-glass-interactive relative flex flex-col p-2 rounded-2xl text-left overflow-hidden group 
                  ${index === 0 ? 'border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : ''}
                `}
              >
                <div className="absolute top-4 left-4 z-10 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-mono text-white/80">
                  {index + 1}
                </div>
                <motion.div layoutId={`image-${design.id}`} className="w-full aspect-square rounded-xl overflow-hidden bg-black/40">
                  <img src={design.image_url} alt={design.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </motion.div>
                <div className="p-3">
                  <h3 className="text-xs tracking-wide font-light text-white/80 truncate">{design.name}</h3>
                  <p className="text-[10px] font-mono text-white/40 mt-1 uppercase">Elo {design.elo_score}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDesign && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDesign(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xl z-40 cursor-pointer"
            />
            <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-6">
              <motion.div
                layoutId={`card-container-${selectedDesign.id}`}
                className="liquid-glass pointer-events-auto w-full max-w-2xl bg-neutral-900 rounded-[2rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/20"
              >
                <motion.div layoutId={`image-${selectedDesign.id}`} className="w-full max-h-[60vh] bg-black">
                  <img src={selectedDesign.image_url} alt={selectedDesign.name} className="w-full h-full object-contain" />
                </motion.div>
                
                <div className="p-8 flex justify-between items-end">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-light tracking-wide text-white/90">{selectedDesign.name}</h2>
                    <span className="text-xs font-mono text-white/40 uppercase tracking-widest">{selectedDesign.comparison_count} Total Matches</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Current Rating</span>
                    <span className="text-2xl font-mono text-amber-500">{selectedDesign.elo_score}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedDesign(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/60 transition-all"
                >
                  ✕
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}