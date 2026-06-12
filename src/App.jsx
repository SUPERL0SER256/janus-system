import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './App.css';

const K_FACTOR = 32;

// --- PAGE 1: HOME (CREATOR JOURNEY) ---
function HomePage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    setIsCreating(true);
    
    // 1. Create a new project row
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([{}])
      .select()
      .single();

    if (projectError) {
      console.error("Error creating project:", projectError);
      setIsCreating(false);
      return;
    }

    const newProjectId = projectData.id;

    // 2. Seed the project with some initial designs
    // In the final version, this will be an image upload form tied to Supabase Storage
    const initialDesigns = [
      { project_id: newProjectId, name: 'Iteration Alpha', image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop' },
      { project_id: newProjectId, name: 'Iteration Beta', image_url: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?q=80&w=800&auto=format&fit=crop' },
      { project_id: newProjectId, name: 'Iteration Gamma', image_url: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=800&auto=format&fit=crop' },
      { project_id: newProjectId, name: 'Iteration Delta', image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop' },
    ];

    const { error: imagesError } = await supabase
      .from('images')
      .insert(initialDesigns);

    if (imagesError) {
      console.error("Error inserting images:", imagesError);
      setIsCreating(false);
      return;
    }

    // 3. Route to the new project's voting arena
    navigate(`/project/${newProjectId}`);
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-neutral-100 font-sans">
      <div className="max-w-md w-full flex flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-light tracking-widest text-white/90">JANUS</h1>
        <p className="text-white/50 font-light leading-relaxed">
          Upload your design iterations and generate a shareable link to discover the true consensus.
        </p>
        
        <button 
          onClick={handleCreateProject}
          disabled={isCreating}
          className={`mt-4 px-8 py-4 rounded-full bg-white text-black font-medium tracking-wide transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] ${isCreating ? 'opacity-50 scale-95' : 'hover:scale-105'}`}
        >
          {isCreating ? 'Initializing...' : 'Create New Project'}
        </button>
      </div>
    </div>
  );
}

// --- PAGE 2: VOTING ARENA (PARTICIPANT JOURNEY) ---
function VotingArena() {
  const { projectId } = useParams();
  const [designs, setDesigns] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch designs from Supabase when the component mounts
  useEffect(() => {
    const fetchDesigns = async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error("Error fetching designs:", error);
      } else if (data && data.length > 0) {
        setDesigns(data);
        generatePair(data);
      }
      setIsLoading(false);
    };

    fetchDesigns();
  }, [projectId]);

  const generatePair = (currentDesigns) => {
    if (currentDesigns.length < 2) return;
    let indexA = Math.floor(Math.random() * currentDesigns.length);
    let indexB = Math.floor(Math.random() * currentDesigns.length);
    
    while (indexA === indexB) {
      indexB = Math.floor(Math.random() * currentDesigns.length);
    }
    setCurrentPair([currentDesigns[indexA], currentDesigns[indexB]]);
  };

  const handleVote = async (winnerId) => {
    if (isVoting) return;
    setIsVoting(true);

    const [optionA, optionB] = currentPair;
    const isAWinner = winnerId === optionA.id;
    const loserId = isAWinner ? optionB.id : optionA.id;

    // Calculate Expected Scores
    const expectedA = 1 / (1 + Math.pow(10, (optionB.elo_score - optionA.elo_score) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (optionA.elo_score - optionB.elo_score) / 400));

    // Calculate Actual Scores
    const scoreA = isAWinner ? 1 : 0;
    const scoreB = isAWinner ? 0 : 1;

    // Calculate New Ratings
    const newEloA = Math.round(optionA.elo_score + K_FACTOR * (scoreA - expectedA));
    const newEloB = Math.round(optionB.elo_score + K_FACTOR * (scoreB - expectedB));

    // Optimistic UI Update (Update local state instantly for a snappy interface)
    const updatedDesigns = designs.map(design => {
      if (design.id === optionA.id) {
        return { ...design, elo_score: newEloA, comparison_count: design.comparison_count + 1 };
      }
      if (design.id === optionB.id) {
        return { ...design, elo_score: newEloB, comparison_count: design.comparison_count + 1 };
      }
      return design;
    });

    setDesigns(updatedDesigns);

    // Backend Updates (Fire and forget asynchronously)
    try {
      // 1. Log the vote history
      await supabase.from('votes').insert([{
        project_id: projectId,
        winner_id: winnerId,
        loser_id: loserId
      }]);

      // 2. Update Option A's stats in DB
      await supabase.from('images')
        .update({ elo_score: newEloA, comparison_count: optionA.comparison_count + 1 })
        .eq('id', optionA.id);

      // 3. Update Option B's stats in DB
      await supabase.from('images')
        .update({ elo_score: newEloB, comparison_count: optionB.comparison_count + 1 })
        .eq('id', optionB.id);

    } catch (err) {
      console.error("Database update failed:", err);
    }

    setTimeout(() => {
      generatePair(updatedDesigns);
      setIsVoting(false);
    }, 400);
  };

  if (isLoading) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white/50">Loading Project...</div>;
  if (currentPair.length < 2) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white/50">Not enough designs found.</div>;

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-neutral-100 font-sans">
      
      <header className="absolute top-8 left-8 text-xl tracking-widest font-light text-white/70 flex items-center gap-4">
        JANUS 
        <span className="text-white/20 text-xs font-mono px-3 py-1 bg-white/5 rounded-full border border-white/5">
          {projectId.split('-')[0]}...
        </span>
      </header>

      <div className="max-w-5xl w-full flex flex-col items-center gap-12 mt-12">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-center text-white/90">
          Which design is better?
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {currentPair.map((option) => (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={isVoting}
              className={`group relative flex flex-col items-center p-4 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 ease-out 
                ${isVoting ? 'opacity-50 scale-[0.98]' : 'hover:scale-[1.02] hover:bg-white/10 hover:border-white/20'}
              `}
            >
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/20">
                <img src={option.image_url} alt={option.name || 'Design Iteration'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="w-full flex justify-between items-center mt-6 px-4 pb-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-sm tracking-wide font-light">{option.name || 'Untitled'}</span>
                <div className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full border border-white/5">
                  ELO {option.elo_score}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- MAIN ROUTER COMPONENT ---
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/project/:projectId" element={<VotingArena />} />
    </Routes>
  );
}