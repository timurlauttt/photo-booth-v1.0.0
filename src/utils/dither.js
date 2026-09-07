// Floyd-Steinberg Error Diffusion Dithering for GIF quantization
// Eliminates color banding, posterization, and false contouring on skin tones & gradients.

export function applyPaletteWithDither(rgba, palette, width, height) {
  const numPixels = width * height;
  const index = new Uint8Array(numPixels);
  const numColors = palette.length;

  // 16-bit RGB565 cache for ultra-fast nearest color lookup
  // 32 levels R * 64 levels G * 32 levels B = 65,536 entries
  const cache = new Int16Array(65536);
  cache.fill(-1);

  // Helper for euclidean distance
  const findNearestColor = (r, g, b) => {
    let minDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < numColors; i++) {
      const p = palette[i];
      const dr = r - p[0];
      const dg = g - p[1];
      const db = b - p[2];
      // Perceptual weight: 30% R, 59% G, 11% B approximated in integer space
      const dist = dr * dr * 3 + dg * dg * 4 + db * db * 2;
      if (dist < minDist) {
        minDist = dist;
        bestIdx = i;
        if (dist === 0) break;
      }
    }
    return bestIdx;
  };

  // Two-row error diffusion buffers (R, G, B per pixel + 2 padding pixels)
  // Fits easily into CPU L1 cache for maximum speed
  const rowStride = (width + 2) * 3;
  let currRowErr = new Float32Array(rowStride);
  let nextRowErr = new Float32Array(rowStride);

  let pIdx = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dataOffset = pIdx * 4;
      const errOffset = (x + 1) * 3;

      // Add diffused error from previous pixels
      let r = rgba[dataOffset] + currRowErr[errOffset];
      let g = rgba[dataOffset + 1] + currRowErr[errOffset + 1];
      let b = rgba[dataOffset + 2] + currRowErr[errOffset + 2];

      // Clamp to valid 0..255 byte range
      r = r < 0 ? 0 : r > 255 ? 255 : r;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      b = b < 0 ? 0 : b > 255 ? 255 : b;

      const rRound = Math.round(r);
      const gRound = Math.round(g);
      const bRound = Math.round(b);

      // Fast RGB565 cache lookup
      const cacheKey = ((rRound >> 3) << 11) | ((gRound >> 2) << 5) | (bRound >> 3);
      let colorIdx = cache[cacheKey];
      if (colorIdx === -1) {
        colorIdx = findNearestColor(rRound, gRound, bRound);
        cache[cacheKey] = colorIdx;
      }

      index[pIdx] = colorIdx;

      // Calculate quantization error (original - chosen palette color)
      const chosen = palette[colorIdx];
      const errR = r - chosen[0];
      const errG = g - chosen[1];
      const errB = b - chosen[2];

      // Diffuse error via Floyd-Steinberg coefficients:
      //         Pixel   7/16
      // 3/16    5/16    1/16
      // (x+1, y)   -> 7/16
      const rightOffset = (x + 2) * 3;
      currRowErr[rightOffset] += (errR * 7) / 16;
      currRowErr[rightOffset + 1] += (errG * 7) / 16;
      currRowErr[rightOffset + 2] += (errB * 7) / 16;

      // (x-1, y+1) -> 3/16
      const downLeftOffset = x * 3;
      nextRowErr[downLeftOffset] += (errR * 3) / 16;
      nextRowErr[downLeftOffset + 1] += (errG * 3) / 16;
      nextRowErr[downLeftOffset + 2] += (errB * 3) / 16;

      // (x, y+1)   -> 5/16
      const downOffset = (x + 1) * 3;
      nextRowErr[downOffset] += (errR * 5) / 16;
      nextRowErr[downOffset + 1] += (errG * 5) / 16;
      nextRowErr[downOffset + 2] += (errB * 5) / 16;

      // (x+1, y+1) -> 1/16
      const downRightOffset = (x + 2) * 3;
      nextRowErr[downRightOffset] += (errR * 1) / 16;
      nextRowErr[downRightOffset + 1] += (errG * 1) / 16;
      nextRowErr[downRightOffset + 2] += (errB * 1) / 16;

      pIdx++;
    }

    // Swap row error buffers and clear nextRowErr for the next line
    const temp = currRowErr;
    currRowErr = nextRowErr;
    nextRowErr = temp;
    nextRowErr.fill(0);
  }

  return index;
}
