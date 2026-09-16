import React from 'react';
import { Search, Settings, Wand2, Loader2, Film, Check, Trash2 } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { generateImageKey } from '../../utils/migration';
import { saveImage } from '../../utils/indexedDB';

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
}

export default function ContentFactory() {
  const [apiKey, setApiKey] = React.useState(localStorage.getItem('gtf_tmdb_key') || '');
  const [showSettings, setShowSettings] = React.useState(!localStorage.getItem('gtf_tmdb_key'));
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<TMDBMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = React.useState<TMDBMovie | null>(null);

  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [extractedFrames, setExtractedFrames] = React.useState<string[]>([]);
  const [selectedFrames, setSelectedFrames] = React.useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = React.useState(false);

  const addDraft = useStudioStore(s => s.addDraft);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gtf_tmdb_key', apiKey);
    setShowSettings(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !apiKey) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
      alert('Search failed. Check your API key.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleExtractFrames = async () => {
    if (!videoFile) return;
    
    setIsExtracting(true);
    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      // Assuming backend is running on the same host but port 3001
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/studio/extract`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Extraction failed');
      
      const data = await res.json();
      setExtractedFrames(data.frames.map((f: string) => `${API_URL}${f}`));
      setJobId(data.jobId);
    } catch (err) {
      console.error(err);
      alert('Failed to extract frames from video. Is the backend running?');
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleFrame = (url: string) => {
    const next = new Set(selectedFrames);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedFrames(next);
  };

  const handleGenerateDrafts = async () => {
    if (!selectedMovie || selectedFrames.size === 0) return;
    
    setIsGenerating(true);
    try {
      const year = selectedMovie.release_date ? parseInt(selectedMovie.release_date.split('-')[0]) : undefined;
      
      for (const frameUrl of selectedFrames) {
        // Fetch the frame image from the backend, convert to base64
        const res = await fetch(frameUrl);
        const blob = await res.blob();
        
        // Read as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const key = generateImageKey();
        await saveImage(key, base64);
        
        addDraft({
          id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          draftImageKey: key,
          metadata: {
            answer: selectedMovie.title,
            year: year,
            hint: selectedMovie.overview.substring(0, 100) + '...',
          }
        });
      }
      
      alert(`Generated ${selectedFrames.size} drafts! Check the Staging Queue.`);
      
      // Cleanup backend frames
      if (jobId) {
        const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        fetch(`${API_URL}/api/studio/cleanup/${jobId}`, { method: 'DELETE' }).catch(console.error);
      }
      
      // Reset state
      setExtractedFrames([]);
      setSelectedFrames(new Set());
      setVideoFile(null);
      setJobId(null);
      
    } catch (err) {
      console.error(err);
      alert('Failed to generate drafts.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="content-factory" style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0' }}>
          <Wand2 size={20} color="#b06fe0" /> Automated Content Factory
        </h3>
        <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <Settings size={18} />
        </button>
      </div>

      {showSettings && (
        <form onSubmit={handleSaveApiKey} style={{ display: 'flex', gap: 12, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>TMDB API Key (v3)</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)} 
              placeholder="Enter TMDB v3 API Key"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: '#fff' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', height: 38 }}>Save Key</button>
        </form>
      )}

      {/* STEP 1: Metadata */}
      <div className="factory-step">
        <h4 style={{ margin: '0 0 12px 0', color: '#cbd5e1' }}>1. Movie Metadata</h4>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Search movie title..."
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: '#fff' }}
              disabled={!apiKey}
            />
          </div>
          <button type="submit" className="btn-outline" disabled={!apiKey || isSearching} style={{ width: 100 }}>
            {isSearching ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
          </button>
        </form>
        
        {searchResults.length > 0 && !selectedMovie && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {searchResults.map(m => (
              <div 
                key={m.id} 
                onClick={() => setSelectedMovie(m)}
                style={{ display: 'flex', gap: 12, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, cursor: 'pointer', border: '1px solid transparent' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#b06fe0'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                {m.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt="" style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <div style={{ width: 40, height: 60, background: '#334', borderRadius: 4 }} />
                )}
                <div>
                  <div style={{ fontWeight: 'bold' }}>{m.title} <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>({m.release_date?.split('-')[0]})</span></div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {m.overview}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedMovie && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12, padding: 12, background: 'rgba(176, 111, 224, 0.1)', border: '1px solid #b06fe0', borderRadius: 8 }}>
            {selectedMovie.poster_path && (
              <img src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`} alt="" style={{ width: 60, height: 90, objectFit: 'cover', borderRadius: 4 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#b06fe0' }}>{selectedMovie.title}</div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>{selectedMovie.release_date?.split('-')[0]}</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{selectedMovie.overview}</div>
            </div>
            <button onClick={() => setSelectedMovie(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', height: 'fit-content' }}>
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* STEP 2: Video Extraction */}
      <div className="factory-step" style={{ opacity: selectedMovie ? 1 : 0.5, pointerEvents: selectedMovie ? 'auto' : 'none' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#cbd5e1' }}>2. Source Video</h4>
        <div style={{ display: 'flex', gap: 12 }}>
          <input 
            type="file" 
            accept="video/mp4,video/mkv,video/webm" 
            onChange={e => setVideoFile(e.target.files?.[0] || null)}
            style={{ flex: 1, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, color: '#e2e8f0' }}
          />
          <button 
            onClick={handleExtractFrames} 
            disabled={!videoFile || isExtracting}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            {isExtracting ? <Loader2 className="animate-spin" size={16} /> : <Film size={16} />}
            {isExtracting ? 'Extracting Frames...' : 'Extract Frames'}
          </button>
        </div>
      </div>

      {/* STEP 3: Frame Selection */}
      {extractedFrames.length > 0 && (
        <div className="factory-step">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: '#cbd5e1' }}>3. Select Frames ({selectedFrames.size} selected)</h4>
            <button 
              onClick={handleGenerateDrafts}
              disabled={selectedFrames.size === 0 || isGenerating}
              className="btn-primary"
              style={{ background: '#059669', borderColor: '#059669' }}
            >
              {isGenerating ? 'Generating...' : `Create ${selectedFrames.size} Drafts`}
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: 12, 
            maxHeight: 400, 
            overflowY: 'auto',
            padding: '4px'
          }}>
            {extractedFrames.map(url => (
              <div 
                key={url}
                onClick={() => toggleFrame(url)}
                style={{ 
                  position: 'relative', 
                  aspectRatio: '16/9', 
                  borderRadius: 6, 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  border: selectedFrames.has(url) ? '3px solid #059669' : '3px solid transparent'
                }}
              >
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                {selectedFrames.has(url) && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: '#059669', color: '#fff', borderRadius: '50%', padding: 2, display: 'flex' }}>
                    <Check size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
