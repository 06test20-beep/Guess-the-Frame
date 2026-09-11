import React, { useState, useEffect } from 'react';
import { getImage } from '../utils/indexedDB';
import { isIdbKey } from '../utils/migration';

interface AsyncImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
}

export default function AsyncImage({ src, fallbackSrc, className, alt, ...props }: AsyncImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function resolveSource() {
      if (!src) {
        setResolvedSrc(fallbackSrc);
        setLoading(false);
        return;
      }

      if (isIdbKey(src)) {
        setLoading(true);
        try {
          const base64 = await getImage(src);
          if (isMounted) {
            setResolvedSrc(base64 || fallbackSrc);
          }
        } catch (e) {
          console.error('[AsyncImage] Failed to load IDB image:', e);
          if (isMounted) setResolvedSrc(fallbackSrc);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        setResolvedSrc(src);
        setLoading(false);
      }
    }

    resolveSource();

    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc]);

  if (loading) {
    return (
      <div className={`async-image-loading ${className || ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }} {...(props as any)}>
        <span style={{ opacity: 0.5 }}>Loading...</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt || ''}
      className={className}
      {...props}
    />
  );
}
