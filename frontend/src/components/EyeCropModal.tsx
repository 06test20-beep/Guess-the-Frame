import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Crop as CropIcon } from 'lucide-react';

interface EyeCropModalProps {
  file: File;
  onSave: (cropFile: File, fullFile: File) => void;
  onCancel: () => void;
}

export default function EyeCropModal({ file, onSave, onCancel }: EyeCropModalProps) {
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Create object URL for the uploaded file
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setImgSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    // Sensible default crop (3:1 aspect ratio centered on the image)
    const crop = centerCrop(
      makeAspectCrop(
        { width: 60, unit: '%' }, // 60% of width
        3 / 1, // aspect
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }

  // Update live preview when completedCrop changes
  useEffect(() => {
    if (!completedCrop || !imgRef.current) return;
    
    let active = true;
    const generatePreview = async () => {
      try {
        const blob = await extractCropBlob(imgRef.current!, completedCrop);
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (e) {
        console.error('Failed to generate live preview', e);
      }
    };
    generatePreview();
    return () => { active = false; };
  }, [completedCrop]);

  const extractCropBlob = (image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(pixelCrop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(pixelCrop.height * scaleY * pixelRatio);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No 2d context'));
      
      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';
      
      const cropX = pixelCrop.x * scaleX;
      const cropY = pixelCrop.y * scaleY;
      const cropWidth = pixelCrop.width * scaleX;
      const cropHeight = pixelCrop.height * scaleY;

      ctx.drawImage(
        image,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas is empty'));
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) return;
    try {
      const blob = await extractCropBlob(imgRef.current, completedCrop);
      const cropFile = new File([blob], 'eye_crop.jpg', { type: 'image/jpeg' });
      onSave(cropFile, file);
    } catch (e) {
      console.error('Crop save failed:', e);
      alert('Failed to generate crop. Please try again.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', padding: '20px', alignItems: 'center'
    }}>
      <div style={{
        width: '100%', maxWidth: '1000px', background: 'var(--panel-bg)',
        borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', height: '100%', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CropIcon size={20} /> Select Eye Region
          </h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Workspace */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          
          {/* Main Cropper Area */}
          <div style={{ flex: 1, padding: '24px', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                minWidth={50}
                minHeight={20}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  style={{ maxHeight: '60vh', objectFit: 'contain' }}
                />
              </ReactCrop>
            )}
          </div>

          {/* Sidebar / Preview */}
          <div style={{
            width: '320px', borderLeft: '1px solid var(--border-soft)', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>Live Preview</h3>
            
            <div style={{ flex: 1 }}>
              {previewUrl ? (
                <div style={{
                  background: '#000', borderRadius: '12px', overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '10px'
                }}>
                  <img
                    src={previewUrl}
                    alt="Crop preview"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'scale-down' }}
                  />
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select an area to preview...</div>
              )}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px' }}>
                Adjust the selection box to capture the eyes clearly without cutting them off. You are not locked to a specific aspect ratio.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
              <button 
                className="btn-primary" 
                style={{ flex: 2 }} 
                onClick={handleSave}
                disabled={!completedCrop?.width || !completedCrop?.height}
              >
                Save Crop
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
