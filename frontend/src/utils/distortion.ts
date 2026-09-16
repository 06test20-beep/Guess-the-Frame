import { saveImage } from './indexedDB';
import { generateImageKey } from './migration';

/**
 * Applies a simple deterministic "glitch/slice" distortion to an image 
 * and returns the new idb:// key.
 */
export async function applyDistortion(base64Src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original
      ctx.drawImage(img, 0, 0);

      // Apply slice-and-shift glitch
      const sliceHeight = Math.max(5, Math.floor(canvas.height / 30));
      for (let y = 0; y < canvas.height; y += sliceHeight) {
        if (Math.random() > 0.4) {
          const shiftX = (Math.random() - 0.5) * (canvas.width * 0.1); // Shift by up to 5% width
          const sliceData = ctx.getImageData(0, y, canvas.width, sliceHeight);
          ctx.putImageData(sliceData, shiftX, y);
        }
      }

      // Add a slight RGB channel split effect
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(5, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
      ctx.fillRect(-5, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      const distortedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      const newKey = generateImageKey();
      await saveImage(newKey, distortedBase64);
      resolve(newKey);
    };
    img.onerror = reject;
    img.src = base64Src;
  });
}
