import sharp from 'sharp'

interface AiRetouchParams {
  bgColor: string
  clarity: string
  brightness: string
  skinSmooth: string
}

const CLARITY_SIGMA: Record<string, number> = {
  '轻度增强': 1.2,
  '标准增强': 2.0,
  '高度增强': 3.5,
}

const BRIGHTNESS_MAP: Record<string, number> = {
  '自动优化': 1.05,
  '调亮+0.5': 1.15,
  '调亮+1.0': 1.30,
}

/**
 * Median filter size for skin smoothing.
 * Median is edge-preserving: it removes fine texture (pores, blemishes)
 * while keeping sharp edges (eyes, hair, clothing lines) intact.
 * This avoids the "plastic" look of Gaussian blur.
 */
const SKIN_SMOOTH_MEDIAN: Record<string, number> = {
  '轻度磨皮': 3,    // barely perceptible — just reduces sensor noise
  '标准磨皮': 5,    // visible smoothing, natural look
  '深度磨皮': 7,    // stronger smoothing, still preserves edges
}

/**
 * Detect the likely background color by sampling edge/corner pixels.
 * Studio photos typically have a uniform backdrop visible at edges.
 */
async function detectBackgroundColor(
  input: ReturnType<typeof sharp>
): Promise<{ r: number; g: number; b: number }> {
  const meta = await input.metadata()
  const w = meta.width || 800
  const h = meta.height || 600
  const edgeWidth = Math.max(4, Math.floor(w * 0.03))

  // Sample strips from all 4 edges
  const edges = [
    { left: 0, top: 0, width: w, height: edgeWidth },           // top
    { left: 0, top: h - edgeWidth, width: w, height: edgeWidth }, // bottom
    { left: 0, top: 0, width: edgeWidth, height: h },             // left
    { left: w - edgeWidth, top: 0, width: edgeWidth, height: h }, // right
  ]

  let rSum = 0, gSum = 0, bSum = 0, count = 0

  for (const region of edges) {
    try {
      const raw = await input
        .clone()
        .extract({
          left: Math.max(0, region.left),
          top: Math.max(0, region.top),
          width: Math.min(w - region.left, region.width),
          height: Math.min(h - region.top, region.height),
        })
        .resize(Math.max(1, Math.floor(region.width / 4)), Math.max(1, Math.floor(region.height / 4)), {
          fit: 'fill',
        })
        .raw()
        .toBuffer({ resolveWithObject: true })

      const pixels = raw.data
      for (let i = 0; i < pixels.length; i += 3) {
        rSum += pixels[i]
        gSum += pixels[i + 1]
        bSum += pixels[i + 2]
        count++
      }
    } catch {
      // Skip failed edge extractions
    }
  }

  if (count === 0) {
    return { r: 255, g: 255, b: 255 } // default white
  }

  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  }
}

/**
 * Replace the detected background with the target color.
 *
 * Strategy (chroma-key for studio portraits):
 *  1. Detect the background color from edge pixels
 *  2. For each pixel, compute color distance to the background
 *  3. Pixels close to the background → make transparent (alpha=0)
 *  4. Pixels far from the background (subject) → keep (alpha=255)
 *  5. Soft transition zone (feathering)
 *  6. Flatten onto the new background color
 *
 * Quality note: uses raw pixel I/O + single PNG round-trip to avoid
 * the 5-channel bug (ensureAlpha + joinChannel = corrupt alpha).
 */
async function replaceBackground(
  buffer: Buffer,
  targetHex: string
): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width || 800
  const h = meta.height || 600

  // Work on a downscaled copy for performance, then scale mask back up
  const maxDim = 600
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const smallW = Math.round(w * scale)
  const smallH = Math.round(h * scale)

  // Get raw RGB data at small size
  const small = sharp(buffer).resize(smallW, smallH, { fit: 'inside' })
  const { data: smallData } = await small.clone().raw().toBuffer({ resolveWithObject: true })

  // Detect background from downscaled image edges
  const bgColor = await detectBackgroundColor(small)

  // Parse target color
  const clean = targetHex.replace('#', '')
  const targetR = parseInt(clean.substring(0, 2), 16)
  const targetG = parseInt(clean.substring(2, 4), 16)
  const targetB = parseInt(clean.substring(4, 6), 16)

  // If detected background is very close to target, skip replacement
  const bgDist = Math.sqrt(
    (bgColor.r - targetR) ** 2 + (bgColor.g - targetG) ** 2 + (bgColor.b - targetB) ** 2
  )
  if (bgDist < 25) {
    // Background is already close to target — no replacement needed
    return buffer
  }

  // Build alpha mask at small size, then scale up to full size
  const maskPixels = new Uint8Array(smallW * smallH)
  const THRESHOLD = 35    // max color distance to consider "background"
  const FEATHER = 14       // feathering zone width

  for (let i = 0; i < smallData.length; i += 3) {
    const pixelIdx = i / 3
    const dr = smallData[i] - bgColor.r
    const dg = smallData[i + 1] - bgColor.g
    const db = smallData[i + 2] - bgColor.b
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)

    if (dist <= THRESHOLD - FEATHER) {
      maskPixels[pixelIdx] = 0      // definitely background → transparent
    } else if (dist >= THRESHOLD + FEATHER) {
      maskPixels[pixelIdx] = 255    // definitely subject → opaque
    } else {
      // Feathering zone: smooth transition
      const t = (dist - (THRESHOLD - FEATHER)) / (2 * FEATHER)
      maskPixels[pixelIdx] = Math.round(t * 255)
    }
  }

  // Scale mask to full resolution
  const maskBuffer = await sharp(maskPixels, {
    raw: { width: smallW, height: smallH, channels: 1 },
  })
    .resize(w, h, { fit: 'fill', kernel: 'mitchell' })
    .png()
    .toBuffer()

  // Key fix: start from raw RGB (3 channels), then joinChannel adds mask
  // as the 4th (alpha) channel. This avoids the 5-channel corruption that
  // happened when ensureAlpha (4ch) + joinChannel (1ch) = 5 channels.
  const { data: rgbData } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgbaPng = await sharp(rgbData, {
    raw: { width: w, height: h, channels: 3 },
  })
    .joinChannel(maskBuffer)         // 3ch RGB + 1ch mask = 4ch RGBA ✓
    .png()
    .toBuffer()

  // Flatten onto new background — alpha channel (the mask) controls compositing
  return sharp(rgbaPng)
    .flatten({ background: { r: targetR, g: targetG, b: targetB } })
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toBuffer()
}

/**
 * Apply real image processing with sharp.
 *
 * Processing pipeline (single-pass, ONE JPEG encode):
 *  1. Brightness modulation
 *  2. Skin smoothing — edge-preserving median filter
 *  3. Clarity / sharpening enhancement (runs LAST to maximize detail)
 *  4. Background color replacement (separate step, one additional encode)
 *
 * Quality architecture:
 *  - All basic adjustments share ONE sharp pipeline → single JPEG encode
 *  - Original buffer returned unchanged when no operations apply (zero quality loss)
 *  - Background replacement is the only extra encode (unavoidable)
 *
 * Vercel Hobby timeout safeguard:
 *  - Images > 45MP are pre-downscaled (covers medium-format; 24-36MP DSLR untouched)
 */
const MAX_MP_FOR_FULL_PROCESSING = 45
const TARGET_MP_AFTER_DOWNSCALE = 24

export async function processImage(
  buffer: Buffer,
  params: AiRetouchParams
): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const origW = meta.width || 800
  const origH = meta.height || 600
  const origMP = (origW * origH) / 1_000_000

  // Only downscale extremely large images (medium-format, high-MP sensors)
  let workingBuffer = buffer
  if (origMP > MAX_MP_FOR_FULL_PROCESSING) {
    const scale = Math.sqrt(TARGET_MP_AFTER_DOWNSCALE / origMP)
    const workingW = Math.round(origW * scale)
    const workingH = Math.round(origH * scale)
    workingBuffer = await sharp(buffer)
      .resize(workingW, workingH, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
      .toBuffer()
  }

  const hasSkin = params.skinSmooth && params.skinSmooth !== 'none'
  const hasClarity = params.clarity && params.clarity !== '不处理' && CLARITY_SIGMA[params.clarity]
  const hasBrightness = params.brightness && params.brightness !== 'keep' && BRIGHTNESS_MAP[params.brightness]
  const hasBgReplace = params.bgColor && params.bgColor !== 'keep'

  // If nothing to do, return original (zero quality loss)
  if (!hasSkin && !hasClarity && !hasBrightness && !hasBgReplace) {
    return buffer
  }

  // ── Single pipeline: brightness → skin smoothing → clarity ──
  // All chained into ONE sharp instance = single JPEG encode at the end
  let pipeline = sharp(workingBuffer)

  if (hasBrightness) {
    pipeline = pipeline.modulate({ brightness: BRIGHTNESS_MAP[params.brightness] })
  }

  if (hasSkin) {
    const medianSize = SKIN_SMOOTH_MEDIAN[params.skinSmooth] || 5
    pipeline = pipeline
      .median(medianSize)
      .sharpen({ sigma: 1.5, m1: 1.2, m2: 0.4 })
  }

  if (hasClarity) {
    const sigma = CLARITY_SIGMA[params.clarity]
    pipeline = pipeline.sharpen({ sigma, m1: 0.9, m2: 0.5 })
  }

  let processed = await pipeline
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toBuffer()

  // ── Background replacement (unavoidable second encode) ──
  if (hasBgReplace) {
    try {
      processed = await replaceBackground(processed, params.bgColor)
    } catch {
      // If background replacement fails, return the image without it
    }
  }

  return processed
}

/**
 * Kept for backward compatibility — no longer used internally but exported
 * in case other modules reference it.
 */
export async function submitAiRetouch(
  _originalUrl: string,
  _params: AiRetouchParams
): Promise<{ taskId: string }> {
  return { taskId: `task_${Date.now()}` }
}

export async function queryAiResult(_taskId: string): Promise<{
  success: boolean
  resultUrl?: string
  errorMessage?: string
}> {
  return { success: true }
}
