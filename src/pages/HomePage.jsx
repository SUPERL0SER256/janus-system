import Footer from '../components/Footer';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';
import './HomePage.css';

const RATE_LIMIT_KEY = 'janus_project_creates';
const MAX_CREATES = 3;
const WINDOW_MS = 60 * 60 * 1000;

const checkRateLimit = () => {
  const raw = localStorage.getItem(RATE_LIMIT_KEY);
  const timestamps = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const recent = timestamps.filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_CREATES) {
    const oldest = Math.min(...recent);
    const minutesLeft = Math.ceil((WINDOW_MS - (now - oldest)) / 60000);
    return { allowed: false, minutesLeft };
  }
  recent.push(now);
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
  return { allowed: true };
};

export default function HomePage() {
  const [hasConsented, setHasConsented] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [votingLink, setVotingLink] = useState(null);
  const [resultsLink, setResultsLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleCreateProject = async () => {
    if (files.length < 2) return;

    const { allowed, minutesLeft } = checkRateLimit();
    if (!allowed) {
      alert(`You've created 3 projects in the last hour. Please wait ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'} before creating another.`);
      return;
    }

    setIsCreating(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([{
          title: title.trim() || null,
          description: description.trim() || null
        }])
        .select()
        .single();
      if (projectError) throw projectError;

      const newProjectId = projectData.id;
      const compressionOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
      };
      const uploadPromises = files.map(async (file) => {
        const compressedFile = await imageCompression(file, compressionOptions);
        const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}.webp`;
        const filePath = `${newProjectId}/${uniqueFileName}`;
        await supabase.storage.from('designs').upload(filePath, compressedFile);
        const { data: urlData } = supabase.storage.from('designs').getPublicUrl(filePath);
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
    <div className="page">
      <div className="page-inner">
        <div className="header-block">
          <h1 className="title">The 'Janus System'</h1>
          {!votingLink && (
            <p className="subtitle">
              Reduces cognitive load via simple comparisons, revealing the strongest iteration through collective intelligence.
            </p>
          )}
        </div>

        {!votingLink ? (
          <div className="stack">

            {/* Project details */}
            <div className="upload-container">
              <div className="upload-header">Project Details</div>
              <div className="field-stack">
                <div className="input-field">
                  <label className="input-label">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Logo Redesign — Round 2"
                    className="text-input"
                    maxLength={80}
                  />
                </div>
                <div className="input-field">
                  <label className="input-label">Description <span className="input-optional">(optional)</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Give voters some context — what are these designs for? What should they focus on?"
                    className="text-input text-textarea"
                    maxLength={300}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Image upload */}
            <div className="upload-container">
              <div className="upload-header">Images</div>
              <label className="dropzone">
                <span className="upload-btn">↑ Upload</span>
                <span className="dropzone-text">Choose images or drag & drop them here.</span>
                <span className="dropzone-subtext">JPG, PNG, and WEBP supported.</span>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden-input" />
              </label>
              {files.length > 0 && (
                <p className="files-selected">{files.length} image{files.length === 1 ? '' : 's'} selected</p>
              )}
            </div>

            <label className="consent-row">
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                className="consent-checkbox"
              />
              <span className="consent-text">
                I own or have rights to all uploaded images and agree to the{' '}
                <Link to="/terms" className="consent-link" onClick={(e) => e.stopPropagation()}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="consent-link" onClick={(e) => e.stopPropagation()}>
                  Privacy Policy
                </Link>.
              </span>
            </label>

            <button
              onClick={handleCreateProject}
              disabled={isCreating || files.length < 2 || !hasConsented}
              className="btn-primary"
            >
              {isCreating ? 'Compressing & Initializing...' : 'Create Link'}
            </button>
          </div>
        ) : (
          <div className="result-container">
            <h2 className="result-title">Arena Initialized</h2>
            <div className="field-block">
              <label className="field-label">Share this with voters</label>
              <div className="input-row">
                <div className="input-display">{votingLink}</div>
                <button onClick={copyToClipboard} className="btn-secondary">
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="field-block">
              <label className="field-label">Keep this for your records</label>
              <Link to={resultsLink.replace(window.location.origin, '')} className="btn-link">
                View Results Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}