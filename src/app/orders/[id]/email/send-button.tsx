'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export function SendButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-indigo-500 hover:bg-indigo-600"
    >
      {pending ? '发送中...' : '一键发送'}
    </Button>
  )
}
