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

const SKIN_SMOOTH_BLUR: Record<string, number> = {
  '轻度磨皮': 2.5,
  '标准磨皮': 5.0,
  '深度磨皮': 10.0,
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

  // Create full-res image with alpha channel, then apply mask
  const rgbaImage = await sharp(buffer)
    .ensureAlpha()
    .png()
    .toBuffer()

  // Apply mask: composite image with itself using the mask as alpha
  const maskedImage = await sharp(rgbaImage)
    .joinChannel(maskBuffer)
    .png()
    .toBuffer()

  // Flatten onto new background
  return sharp(maskedImage)
    .flatten({ background: { r: targetR, g: targetG, b: targetB } })
    .jpeg({ quality: 95 })
    .toBuffer()
}

/**
 * Apply real image processing with sharp.
 *
 * Processing pipeline:
 *  1. Brightness modulation
 *  2. Clarity / sharpening enhancement
 *  3. Skin smoothing via blur-then-sharpen (simulated bilateral filter)
 *  4. Background color replacement via edge-sampled chroma-key detection
 */
export async function processImage(
  buffer: Buffer,
  params: AiRetouchParams
): Promise<Buffer> {
  // --- 1. Brightness ---
  const brightness = BRIGHTNESS_MAP[params.brightness]
  let pipeline = sharp(buffer)
  if (brightness) {
    pipeline = pipeline.modulate({ brightness })
  }

  // --- 2. Clarity / sharpening ---
  const sigma = CLARITY_SIGMA[params.clarity]
  if (sigma) {
    pipeline = pipeline.sharpen({ sigma, m1: 0.8, m2: 0.5 })
  }

  let processed = await pipeline.jpeg({ quality: 95 }).toBuffer()

  // --- 3. Skin smoothing (blur + sharpen recovery) ---
  if (params.skinSmooth && params.skinSmooth !== 'none') {
    const blurSigma = SKIN_SMOOTH_BLUR[params.skinSmooth] || 5
    processed = await sharp(processed)
      .blur(blurSigma)
      .sharpen({ sigma: 1.0, m1: 1.2, m2: 0.3 })
      .jpeg({ quality: 95 })
      .toBuffer()
  }

  // --- 4. Background color replacement ---
  // Uses edge-sampled chroma-key detection (works well for studio portraits
  // with uniform backdrops). Falls back gracefully for complex backgrounds.
  if (params.bgColor && params.bgColor !== 'keep') {
    try {
      processed = await replaceBackground(processed, params.bgColor)
    } catch {
      // If background replacement fails, return the image without it
      // (better than ruining the photo with a global tint)
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
