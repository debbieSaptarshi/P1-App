import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

export const SAUCER_CROP_VERSION = 'saucer-v1';

type Bitmap = { width: number; height: number; data: Buffer };

function luma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function pixel(bitmap: Bitmap, x: number, y: number): number {
  return (y * bitmap.width + x) * 4;
}

function sniffMediaType(bytes: Buffer): 'image/jpeg' | 'image/png' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return null;
}

function decode(bytes: Buffer): Bitmap | null {
  const kind = sniffMediaType(bytes);
  try {
    if (kind === 'image/png') {
      const png = PNG.sync.read(bytes);
      return { width: png.width, height: png.height, data: png.data };
    }
    if (kind === 'image/jpeg') {
      const decoded = jpeg.decode(bytes, { maxMemoryUsageInMB: 64, maxResolutionInMP: 16 });
      return { width: decoded.width, height: decoded.height, data: Buffer.from(decoded.data) };
    }
  } catch {
    return null;
  }
  return null;
}

function encodePng(bitmap: Bitmap): { imageBase64: string; mediaType: 'image/png' } {
  const png = new PNG({ width: bitmap.width, height: bitmap.height });
  png.data = bitmap.data;
  return { imageBase64: PNG.sync.write(png).toString('base64'), mediaType: 'image/png' };
}

function sampleBackground(bitmap: Bitmap): number {
  const { width, height, data } = bitmap;
  const patch = Math.max(2, Math.floor(Math.min(width, height) * 0.03));
  let sum = 0;
  let n = 0;
  const corners: Array<[number, number]> = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ];
  for (const [sx, sy] of corners) {
    for (let y = sy; y < sy + patch; y += 1) {
      for (let x = sx; x < sx + patch; x += 1) {
        const i = pixel(bitmap, x, y);
        sum += luma(data[i], data[i + 1], data[i + 2]);
        n += 1;
      }
    }
  }
  return sum / n;
}

function colorDist(bitmap: Bitmap, x: number, y: number, br: number, bg: number, bb: number): number {
  const i = pixel(bitmap, x, y);
  const dr = bitmap.data[i] - br;
  const dg = bitmap.data[i + 1] - bg;
  const db = bitmap.data[i + 2] - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function saucerCircle(bitmap: Bitmap): { cx: number; cy: number; radius: number } | null {
  const bgLuma = sampleBackground(bitmap);
  if (bgLuma < 28) return null;
  const { width, height, data } = bitmap;
  const patch = Math.max(2, Math.floor(Math.min(width, height) * 0.03));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const [sx, sy] of [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ] as Array<[number, number]>) {
    for (let y = sy; y < sy + patch; y += 1) {
      for (let x = sx; x < sx + patch; x += 1) {
        const i = pixel(bitmap, x, y);
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
    }
  }
  r /= n;
  g /= n;
  b /= n;
  const threshold = 18;
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const maxR = Math.hypot(cx, cy);
  const rays = 64;
  const radii: number[] = [];
  for (let k = 0; k < rays; k += 1) {
    const angle = (k / rays) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let radius = 0;
    let bgRun = 0;
    for (let t = 0; t < maxR; t += 1) {
      const x = Math.round(cx + dx * t);
      const y = Math.round(cy + dy * t);
      if (x < 0 || y < 0 || x >= width || y >= height) break;
      const i = pixel(bitmap, x, y);
      const L = luma(bitmap.data[i], bitmap.data[i + 1], bitmap.data[i + 2]);
      const onBackdrop = L <= bgLuma + 10 && colorDist(bitmap, x, y, r, g, b) < threshold;
      if (onBackdrop) {
        bgRun += 1;
        if (bgRun >= 3) break;
        continue;
      }
      radius = t;
      bgRun = 0;
    }
    if (radius > 0) radii.push(radius);
  }
  if (radii.length < rays * 0.5) return null;
  radii.sort((a, b) => a - b);
  const radius = radii[Math.floor(radii.length / 2)];
  if (radius < Math.min(width, height) * 0.2) return null;
  return { cx, cy, radius };
}

function cropBitmap(bitmap: Bitmap): Bitmap | null {
  const circle = saucerCircle(bitmap);
  if (!circle) return null;
  const size = Math.max(8, Math.round(circle.radius * 2));
  const left = Math.max(0, Math.min(bitmap.width - size, Math.round(circle.cx - size / 2)));
  const top = Math.max(0, Math.min(bitmap.height - size, Math.round(circle.cy - size / 2)));
  if (size >= bitmap.width * 0.995 && size >= bitmap.height * 0.995) return null;

  const out = Buffer.alloc(size * size * 4);
  const r2 = (size / 2) * (size / 2);
  const mid = size / 2 - 0.5;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - mid;
      const dy = y - mid;
      const oi = (y * size + x) * 4;
      if (dx * dx + dy * dy > r2) {
        out[oi + 3] = 0;
        continue;
      }
      const si = pixel(bitmap, left + x, top + y);
      out[oi] = bitmap.data[si];
      out[oi + 1] = bitmap.data[si + 1];
      out[oi + 2] = bitmap.data[si + 2];
      out[oi + 3] = 255;
    }
  }
  return { width: size, height: size, data: out };
}

/** Tight circular crop to the saucer rim. Returns the original bytes if the image cannot be decoded. */
export function cropToSaucer(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
): { imageBase64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' } {
  if (mediaType === 'image/webp') return { imageBase64, mediaType };
  const bitmap = decode(Buffer.from(imageBase64, 'base64'));
  if (!bitmap) return { imageBase64, mediaType };
  const cropped = cropBitmap(bitmap);
  if (!cropped) return { imageBase64, mediaType };
  return encodePng(cropped);
}
