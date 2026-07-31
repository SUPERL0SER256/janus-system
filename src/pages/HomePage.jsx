import { useState, useEffect } from 'react';
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
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [votingLink, setVotingLink] = useState(null);
  const [resultsLink, setResultsLink] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, []);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map((file, index) => {
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: `Iteration ${files.length + index + 1}`,
        preview: URL.createObjectURL(file)
      };
    });
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFileName = (id, newName) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
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
      const uploadPromises = files.map(async (fileObj) => {
        const compressedFile = await imageCompression(fileObj.file, compressionOptions);
        const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}.webp`;
        const filePath = `${newProjectId}/${uniqueFileName}`;
        await supabase.storage.from('designs').upload(filePath, compressedFile);
        const { data: urlData } = supabase.storage.from('designs').getPublicUrl(filePath);
        return {
          project_id: newProjectId,
          name: fileObj.name,
          image_url: urlData.publicUrl,
          elo_score: 1200,
          comparison_count: 0
        };
      });
      const finalImageRecords = await Promise.all(uploadPromises);
      await supabase.from('images').insert(finalImageRecords);

      const creatorProjects = JSON.parse(localStorage.getItem('janus_creator_projects') || '[]');
      if (!creatorProjects.includes(newProjectId)) {
        creatorProjects.push(newProjectId);
        localStorage.setItem('janus_creator_projects', JSON.stringify(creatorProjects));
      }

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
              {files.length === 0 ? (
                <label className="dropzone">
                  <span className="upload-btn">↑ Upload</span>
                  <span className="dropzone-text">Choose images or drag & drop them here.</span>
                  <span className="dropzone-subtext">JPG, PNG, and WEBP supported.</span>
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden-input" />
                </label>
              ) : (
                <div className="dropzone dropzone--active">
                  <div className="dropzone-grid">
                    {files.map(f => (
                      <div key={f.id} className="thumb-card">
                        <button type="button" className="thumb-remove" onClick={() => removeFile(f.id)}>✕</button>
                        <div className="thumb-img-wrap">
                          <img src={f.preview} alt={f.name} className="thumb-img" />
                        </div>
                        <div className="thumb-name-input">
                          {f.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="dropzone-actions">
                    <label className="btn-secondary dropzone-add-more">
                      + Add More
                      <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden-input" />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="upload-container">
                <div 
                  className="upload-header" 
                  onClick={() => setIsRenameOpen(!isRenameOpen)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}
                >
                  <span>Rename Iterations</span>
                  <span style={{ fontSize: '0.8em', color: '#9ca3af', transition: 'transform 0.2s', transform: isRenameOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </div>
                {isRenameOpen && (
                  <div className="field-stack" style={{ marginTop: '1.5rem' }}>
                    {files.map((f, i) => (
                      <div className="input-field" key={`rename-${f.id}`}>
                        <label className="input-label">Image {i + 1}</label>
                        <input
                          type="text"
                          value={f.name}
                          onChange={(e) => updateFileName(f.id, e.target.value)}
                          placeholder={`Iteration ${i + 1}`}
                          className="text-input"
                          maxLength={30}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
              className="btn-primary liquid-glass liquid-glass-interactive"
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
      <div className="designer-credit">
        Design © Sumer Vaidya 2026
      </div>
    </div>
  );
}