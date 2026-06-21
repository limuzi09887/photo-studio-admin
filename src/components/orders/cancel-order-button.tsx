'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cancelOrder } from '@/app/orders/[id]/actions'

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    setLoading(true)
    try {
      await cancelOrder(orderId)
      toast.success('订单已取消')
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取消失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
          取消订单
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认取消订单</DialogTitle>
          <DialogDescription>
            取消后订单状态将变为"已取消"，客户将无法查看此订单。此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            再想想
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? '取消中...' : '确认取消'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
