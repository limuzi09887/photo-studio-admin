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
 * Apply real image processing with sharp.
 *
 * Processing pipeline:
 *  1. Brightness modulation
 *  2. Clarity / sharpening enhancement
 *  3. Skin smoothing via blur-then-sharpen (simulated bilateral filter)
 *  4. Background color grading via tint and hue shift
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
    // Blur to smooth skin, then sharpen to recover edge definition
    processed = await sharp(processed)
      .blur(blurSigma)
      .sharpen({ sigma: 1.0, m1: 1.2, m2: 0.3 })
      .jpeg({ quality: 95 })
      .toBuffer()
  }

  // --- 4. Background color grading ---
  // Without AI segmentation we cannot do pixel-accurate background replacement.
  // Instead we apply a color tint that shifts the image ambiance toward the
  // chosen background tone — this works well for studio portraits where the
  // background is already uniform.
  if (params.bgColor && params.bgColor !== 'keep') {
    const { r, g, b } = hexToRgb(params.bgColor)
    processed = await sharp(processed)
      .tint({ r, g, b })
      .jpeg({ quality: 95 })
      .toBuffer()
  }

  return processed
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
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
