interface AiRetouchParams {
  bgColor: string
  clarity: string
  brightness: string
  skinSmooth: string
}

export async function submitAiRetouch(
  originalUrl: string,
  params: AiRetouchParams
): Promise<{ taskId: string }> {
  // Call Alibaba Cloud Vision AI API to submit retouch task
  const actions: Record<string, string>[] = []
  if (params.bgColor !== 'keep') actions.push({ type: 'changeBackground', color: params.bgColor })
  if (params.clarity !== '不处理') actions.push({ type: 'enhanceFace', level: params.clarity })
  if (params.brightness !== 'keep') actions.push({ type: 'adjustBrightness', level: params.brightness })
  if (params.skinSmooth !== 'none') actions.push({ type: 'smoothSkin', level: params.skinSmooth })

  const response = await fetch('https://vision.aliyuncs.com/api/v1/retouch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ALIYUN_AI_ACCESS_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrl: originalUrl, actions }),
  })
  const data = await response.json()
  return { taskId: data.taskId || `task_${Date.now()}` }
}

export async function queryAiResult(taskId: string): Promise<{
  success: boolean
  resultUrl?: string
  errorMessage?: string
}> {
  const response = await fetch(`https://vision.aliyuncs.com/api/v1/tasks/${taskId}`, {
    headers: { 'Authorization': `Bearer ${process.env.ALIYUN_AI_ACCESS_KEY}` },
  })
  return response.json()
}
