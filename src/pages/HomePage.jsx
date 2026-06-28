import Footer from '../components/Footer';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

export default function HomePage() {
  const [isCreating, setIsCreating] = useState(false);
  const [files, setFiles] = useState([]);
  const [votingLink, setVotingLink] = useState(null);
  const [resultsLink, setResultsLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleCreateProject = async () => {
    if (files.length < 2) return;
    setIsCreating(true);
    
    try {
      // 1. Create the project row
      const { data: projectData, error: projectError } = await supabase.from('projects').insert([{}]).select().single();
      if (projectError) throw projectError;
      
      const newProjectId = projectData.id;

      // 2. Define Compression Options (Max 0.5MB per image, 1920px max dimension)
      const compressionOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp' // Converts everything to WebP for ultimate efficiency
      };

      // 3. Compress and Upload
      const uploadPromises = files.map(async (file) => {
        // Compress the file
        const compressedFile = await imageCompression(file, compressionOptions);
        
        // Generate a clean, case-sensitive filename (using webp since we converted it)
        const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}.webp`;
        const filePath = `${newProjectId}/${uniqueFileName}`;

        // Upload the COMPRESSED file
        await supabase.storage.from('designs').upload(filePath, compressedFile);
        const { data: urlData } = supabase.storage.from('designs').getPublicUrl(filePath);

        // Keep the original name for the UI, minus the extension
        const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

        return {
          project_id: newProjectId,
          name: originalName,
          image_url: urlData.publicUrl,
          elo_score: 1200,
          comparison_count: 0
        };
      });

      const finalImageRecords = await Promise.all(uploadPromises);
      await supabase.from('images').insert(finalImageRecords);

      setVotingLink(`${window.location.origin}/project/${newProjectId}`);
      setResultsLink(`${window.location.origin}/project/${newProjectId}/results`);
      setIsCreating(false);

    } catch (error) {
      console.error(error);
      setIsCreating(false);
      alert("An error occurred during compression or upload.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(votingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-screen">
      <div className="max-w-xl w-full flex flex-col gap-10">
        
        <div className="text-center space-y-3">
          <h1 className="text-6xl font-extralight tracking-[0.2em] text-white/90">JANUS</h1>
          {!votingLink && (
            <p className="text-white/40 font-light tracking-wide">
              The collaborative decision engine.
            </p>
          )}
        </div>
        
        {!votingLink ? (
          <div className="liquid-glass p-8 rounded-[2rem] flex flex-col gap-8">
            <label className="group relative w-full py-16 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-white/40 transition-colors flex flex-col items-center justify-center bg-white/[0.02]">
              <span className="text-white/80 font-light text-lg mb-2 group-hover:text-white transition-colors">
                {files.length > 0 ? `${files.length} iterations queued` : 'Select Iterations'}
              </span>
              <span className="text-xs text-white/30 font-mono tracking-wider">JPG, PNG, WEBP</span>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            <button 
              onClick={handleCreateProject}
              disabled={isCreating || files.length < 2}
              className={`w-full py-4 rounded-xl font-medium tracking-widest uppercase text-sm transition-all duration-300
                ${isCreating || files.length < 2 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' 
                  : 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                }`}
            >
              {isCreating ? 'Compressing & Initializing...' : 'Generate Arena'}
            </button>
          </div>
        ) : (
          <div className="liquid-glass p-10 rounded-[2rem] flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.1)]">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"></path></svg>
            </div>
            
            <div className="text-center w-full">
              <h2 className="text-xl font-light text-white/90 mb-6">Arena Initialized</h2>
              
              <div className="w-full text-left mb-6">
                <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2 block">1. Share this with voters</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-white/60 overflow-hidden text-ellipsis whitespace-nowrap">
                    {votingLink}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white/90 hover:bg-white/20 transition-all text-xs font-medium tracking-wide border border-white/5 whitespace-nowrap"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="w-full text-left">
                <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2 block text-amber-500/80">2. Keep this for your records</label>
                <Link to={resultsLink.replace(window.location.origin, '')} className="block w-full text-center py-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500/90 hover:bg-amber-500/10 transition-colors text-sm tracking-wide">
                  View Live Results Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}