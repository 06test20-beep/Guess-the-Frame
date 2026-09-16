import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { compressImage } from '../../utils/questionStorage';
import { saveImage } from '../../utils/indexedDB';
import { generateImageKey } from '../../utils/migration';
import { v4 as uuidv4 } from 'uuid';

export default function BatchDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const addDraft = useStudioStore(s => s.addDraft);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setProcessingCount(imageFiles.length);

    for (const file of imageFiles) {
      try {
        // Compress the image (using same defaults as Admin Page)
        const base64 = await compressImage(file, 1280, 0.72);
        const imageKey = generateImageKey();
        
        // Save to IndexedDB
        await saveImage(imageKey, base64);
        
        // Add to drafts
        addDraft({
          id: uuidv4(),
          draftImageKey: imageKey,
          originalFileMeta: { name: file.name, size: file.size },
          metadata: {
            answer: '',
            hint: ''
          }
        });
      } catch (e) {
        console.error(`Failed to process ${file.name}:`, e);
      }
    }
    
    setProcessingCount(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  return (
    <div 
      className={`dropzone-container ${isDragging ? 'is-dragover' : ''}`}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('batch-upload')?.click()}
    >
      <input 
        id="batch-upload"
        type="file" 
        multiple 
        accept="image/jpeg, image/png, image/webp" 
        className="hidden"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {processingCount > 0 ? (
        <div className="dropzone-loading">
          <Loader2 size={48} className="animate-spin" />
          <span>Processing {processingCount} Images...</span>
        </div>
      ) : (
        <>
          <div className="dropzone-icon">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="dropzone-title">Drag & Drop Batch Images</h3>
            <p className="dropzone-text">Drop raw source files here. The Studio will automatically compress, resize, and prepare them for game integration.</p>
            <div className="dropzone-sub">
              <ImageIcon size={14} /> Supports JPEG, PNG, WEBP
            </div>
          </div>
        </>
      )}
    </div>
  );
}
