export interface LoadedImageInfo {
  base64: string;
  extension: 'jpeg' | 'png';
  width: number;
  height: number;
  dataUrl: string;
}

/**
 * Helper to convert an image URL or dataUrl into base64 and measure its natural aspect ratio
 */
export async function loadImageAsBase64(
  url: string,
  maxDim: number = 1200
): Promise<LoadedImageInfo | null> {
  if (!url) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width || 400;
        const naturalHeight = img.naturalHeight || img.height || 300;

        let targetWidth = naturalWidth;
        let targetHeight = naturalHeight;

        // Scale down huge images to keep memory clean
        if (targetWidth > maxDim || targetHeight > maxDim) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
            targetWidth = maxDim;
          } else {
            targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
            targetHeight = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const isPng = url.startsWith('data:image/png') || url.toLowerCase().includes('.png');
        const format = isPng ? 'image/png' : 'image/jpeg';
        const ext = isPng ? 'png' : 'jpeg';
        const dataUrl = canvas.toDataURL(format, 0.92);
        const base64 = dataUrl.replace(new RegExp(`^data:${format};base64,`), '');

        resolve({
          base64,
          extension: ext,
          width: naturalWidth,
          height: naturalHeight,
          dataUrl,
        });
      } catch (err) {
        console.warn('Canvas conversion failed, falling back:', err);
        if (url.startsWith('data:image/')) {
          const isPng = url.startsWith('data:image/png');
          const ext = isPng ? 'png' : 'jpeg';
          const base64 = url.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
          resolve({
            base64,
            extension: ext,
            width: img.naturalWidth || 400,
            height: img.naturalHeight || 300,
            dataUrl: url,
          });
        } else {
          resolve(null);
        }
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}
