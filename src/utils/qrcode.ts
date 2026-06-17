/**
 * Simple QR Code Generator
 * 
 * A lightweight QR code generator using canvas.
 * For production, consider using a library like 'qrcode' or 'qr-code-styling'.
 */

export function generateQRCodeCanvas(text: string, size: number = 150): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Simple QR-like pattern (not a real QR code, but visual placeholder)
  // In production, use a proper QR code library
  const moduleCount = 21; // QR Version 1
  const moduleSize = size / moduleCount;
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Generate a simple pattern based on text hash
  const hash = simpleHash(text);
  ctx.fillStyle = '#1e40af'; // blue-800
  
  // Draw finder patterns (three corners)
  drawFinderPattern(ctx, 0, 0, moduleSize);
  drawFinderPattern(ctx, (moduleCount - 7) * moduleSize, 0, moduleSize);
  drawFinderPattern(ctx, 0, (moduleCount - 7) * moduleSize, moduleSize);
  
  // Draw data modules based on hash
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder pattern areas
      if ((row < 8 && col < 8) || 
          (row < 8 && col >= moduleCount - 8) || 
          (row >= moduleCount - 8 && col < 8)) {
        continue;
      }
      
      // Pseudo-random based on position and hash
      if (((row * moduleCount + col + hash) % 3) === 0) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
  
  return canvas;
}

function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number): void {
  // Outer black square
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
  
  // Inner white square
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
  
  // Center black square
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
}

function simpleHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function generateQRCodeDataUrl(text: string, size: number = 150): string {
  const canvas = generateQRCodeCanvas(text, size);
  return canvas.toDataURL('image/png');
}

export default {
  generateQRCodeCanvas,
  generateQRCodeDataUrl,
};
