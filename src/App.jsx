import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './App.css';

const K_FACTOR = 32;

// --- PAGE 1: HOME (CREATOR JOURNEY) ---
function HomePage() {
  const [isCreating, setIsCreating] = useState(false);
  const [files, setFiles] = useState([]);
  const [shareableLink, setShareableLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleCreateProject = async () => {
    if (files.length < 2) {
      alert("Please upload at least 2 designs to create a comparison project.");
      return;
    }

    setIsCreating(true);
    
    try {
      // 1. Create a new project row
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([{}])
        .select()
        .single();

      if (projectError) throw projectError;
      const newProjectId = projectData.id;

      // 2. Upload images and build records
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${newProjectId}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('designs')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('designs')
          .getPublicUrl(filePath);

        return {
          project_id: newProjectId,
          name: file.name.replace(`.${fileExt}`, ''),
          image_url: urlData.publicUrl,
          elo_score: 1200,
          comparison_count: 0
        };
      });

      const finalImageRecords = await Promise.all(uploadPromises);

      // 3. Insert images into DB
      const { error: dbError } = await supabase
        .from('images')
        .insert(finalImageRecords);

      if (dbError) throw dbError;

      // 4. INSTEAD OF ROUTING, GENERATE THE LINK
      const fullUrl = `${window.location.origin}/project/${newProjectId}`;
      setShareableLink(fullUrl);
      setIsCreating(false);

    } catch (error) {
      console.error("Error generating project:", error);
      alert("Something went wrong during upload. Check console for details.");
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset text after 2 seconds
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-neutral-100 font-sans">
      <div className="max-w-md w-full flex flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-light tracking-widest text-white/90">JANUS</h1>
        
        {/* If the link hasn't been generated, show the upload UI */}
        {!shareableLink ? (
          <>
            <p className="text-white/50 font-light leading-relaxed">
              Upload your design iterations and generate a shareable link to discover the true consensus.
            </p>
            
            <div className="w-full p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col items-center gap-6 transition-all">
              <label className="w-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-white/40 transition-all">
                <span className="text-white/70 font-light tracking-wide mb-2">
                  {files.length > 0 ? `${files.length} designs selected` : 'Drag & drop or click to browse'}
                </span>
                <span className="text-xs text-white/40 font-mono">JPG, PNG, WEBP (Max 50 images)</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>

              <button 
                onClick={handleCreateProject}
                disabled={isCreating || files.length < 2}
                className={`w-full px-8 py-4 rounded-full font-medium tracking-wide transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] 
                  ${isCreating || files.length < 2 
                    ? 'bg-white/20 text-white/50 cursor-not-allowed' 
                    : 'bg-white text-black hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]'
                  }`}
              >
                {isCreating ? 'Uploading & Initializing...' : 'Create New Project'}
              </button>
            </div>
          </>
        ) : (
          /* SUCCESS STATE: Show the generated link */
          <div className="w-full p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col items-center gap-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-light text-white/90">Project Live</h2>
            <p className="text-sm text-white/50">Share this link with your team to start collecting votes.</p>
            
            <div className="w-full flex flex-col gap-3">
              <div className="w-full p-4 bg-black/40 rounded-xl border border-white/10 text-sm font-mono text-white/70 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {shareableLink}
              </div>
              <button 
                onClick={copyToClipboard}
                className="w-full px-8 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all font-medium tracking-wide"
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Link'}
              </button>
            </div>

            <Link 
              to={shareableLink.replace(window.location.origin, '')} 
              className="mt-4 text-sm text-white/40 hover:text-white/80 transition-colors underline underline-offset-4"
            >
              Enter Voting Arena
            </Link>
          </div>
        )}
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

    const expectedA = 1 / (1 + Math.pow(10, (optionB.elo_score - optionA.elo_score) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (optionA.elo_score - optionB.elo_score) / 400));

    const scoreA = isAWinner ? 1 : 0;
    const scoreB = isAWinner ? 0 : 1;

    const newEloA = Math.round(optionA.elo_score + K_FACTOR * (scoreA - expectedA));
    const newEloB = Math.round(optionB.elo_score + K_FACTOR * (scoreB - expectedB));

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

    try {
      await supabase.from('votes').insert([{
        project_id: projectId,
        winner_id: winnerId,
        loser_id: loserId
      }]);

      await supabase.from('images')
        .update({ elo_score: newEloA, comparison_count: optionA.comparison_count + 1 })
        .eq('id', optionA.id);

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

  if (isLoading) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white/50 font-light">Loading Project...</div>;
  if (currentPair.length < 2) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white/50 font-light">Not enough designs found.</div>;

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
                ${isVoting ? 'opacity-50 scale-[0.98]' : 'hover:scale-[1.02] hover:bg-white/10 hover:border-white/20 hover:shadow-[0_16px_64px_0_rgba(255,255,255,0.05)]'}
              `}
            >
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/20">
                <img src={option.image_url} alt={option.name || 'Design Iteration'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="w-full flex justify-between items-center mt-6 px-4 pb-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-sm tracking-wide font-light truncate max-w-[60%] text-left">{option.name || 'Untitled'}</span>
                <div className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full border border-white/5 shrink-0">
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