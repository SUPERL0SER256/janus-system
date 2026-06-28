// src/useImagePrefetch.js
import { useEffect } from 'react';

export function useImagePrefetch(urlArray) {
  useEffect(() => {
    if (!urlArray || urlArray.length === 0) return;
    
    urlArray.forEach((url) => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [urlArray]);
}