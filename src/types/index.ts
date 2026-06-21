export type OrderStatus =
  | '已创建'
  | '已拍摄'
  | '一类修片中'
  | '待精修'
  | '待客户确认'
  | '待发送'
  | '已完成'
  | '已取消'
  | '发送失败'

export type FileType = 'ORIGINAL' | 'AI_RESULT' | 'FINAL'

export type PaymentMethod = '微信支付' | '支付宝' | '现金' | '银行转账'

export type PaymentType = '定金' | '尾款'

export type AiRetouchParams = {
  bgColor: string
  clarity: string
  brightness: string
  skinSmooth: string
}

export type ProgressStep = 1 | 2 | 3 | 4

export type EmailSendStatus = '成功' | '失败'
