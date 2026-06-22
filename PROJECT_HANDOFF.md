# 照相馆经营管理系统 — 项目交接文档

> 生成时间：2026-06-22  
> 最后部署：commit `3edcae4`  
> 生产地址：`https://photo-studio-admin-iota.vercel.app`

---

## 一、项目概览

| 项目 | 说明 |
|------|------|
| **名称** | photo-studio-admin（照相馆经营管理系统） |
| **技术栈** | Next.js 14 App Router + Prisma + PostgreSQL + Tailwind CSS + shadcn/ui |
| **代码仓库** | `https://github.com/limuzi09887/photo-studio-admin` |
| **部署平台** | Vercel（Hobby 计划） |
| **数据库** | Neon PostgreSQL（新加坡区域） |
| **对象存储** | 阿里云 OSS（华东2 上海） |
| **本地端口** | 3001（被占用时用 3002） |

---

## 二、平台与 API Key

### 1. Vercel

| 项目 | 值 |
|------|-----|
| **生产 URL** | `https://photo-studio-admin-iota.vercel.app` |
| **项目 ID** | `prj_x7EEGDL1OPWrOrhbxtPgLavFbCsX` |
| **团队 ID** | `team_Cq3Hcw1uGVv9ZFC5BiU5RU0F` |
| **API Token** | `<见本地 .env 文件或 Vercel 环境变量>` |
| **部署方式** | Git 自动部署（push main → 自动构建） |

**Vercel API 常用命令：**
```bash
# 查看部署状态
curl -s -H "Authorization: Bearer <token>" \
  "https://api.vercel.com/v2/deployments?projectId=<prj_id>&limit=3&teamId=<team_id>"

# 查看构建事件
curl -s -H "Authorization: Bearer <token>" \
  "https://api.vercel.com/v2/deployments/<deploy_id>/events?limit=50&teamId=<team_id>"
```

### 2. Neon PostgreSQL

| 项目 | 值 |
|------|-----|
| **连接串** | `<见 .env 文件 DATABASE_URL>` |
| **区域** | ap-southeast-1（新加坡） |

### 3. 阿里云 OSS

| 项目 | 值 |
|------|-----|
| **Bucket** | `photo-studio-muji` |
| **区域** | `oss-cn-shanghai`（华东2 上海） |
| **公开 URL** | `https://photo-studio-muji.oss-cn-shanghai.aliyuncs.com` |
| **AccessKey ID** | `<见 .env 文件>` |
| **AccessKey Secret** | `<见 .env 文件>` |

### 4. QQ 邮箱 SMTP

| 项目 | 值 |
|------|-----|
| **SMTP 服务器** | `smtp.qq.com:465` |
| **账号** | `<见 .env 文件 SMTP_USER>` |
| **授权码** | `<见 .env 文件 SMTP_PASS>` |

### 5. Vercel 环境变量（已配置）

所有以上变量都已通过 Vercel REST API 设置为 `type: "encrypted"`：
- `DATABASE_URL`
- `OSS_REGION` / `OSS_ENDPOINT` / `OSS_BUCKET` / `OSS_PUBLIC_URL`
- `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`

---

## 三、本地开发环境

**`.env` 文件内容（项目根目录，敏感值见实际文件）：**
```
DATABASE_URL=<Neon 连接串>
OSS_REGION=oss-cn-shanghai
OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com
OSS_BUCKET=photo-studio-muji
OSS_PUBLIC_URL=https://photo-studio-muji.oss-cn-shanghai.aliyuncs.com
ALIYUN_ACCESS_KEY_ID=<阿里云 AK>
ALIYUN_ACCESS_KEY_SECRET=<阿里云 SK>
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=<QQ 邮箱地址>
SMTP_PASS=<QQ 邮箱授权码>
```

**启动本地开发：**
```bash
cd d:/VSCodeCache/code/Code/photo-studio-admin
npm run dev  # 默认 3000 端口
```
如果 3000 被占用：
```bash
npx next dev -p 3002
# 注意：有 http_proxy 代理时需要 --noproxy localhost
curl --noproxy localhost "http://localhost:3002/"
```

**构建命令：**
```bash
npm run build  # = npx prisma generate && npx prisma db push && next build
```

---

## 四、项目文件结构（关键文件）

```
src/
├── app/
│   ├── globals.css              # CSS 变量 (oklch 格式) + Tailwind
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页仪表盘
│   ├── api/
│   │   ├── upload/route.ts      # 服务端上传代理（避免浏览器 CORS）
│   │   ├── files/proxy/route.ts # 图片代理 + 下载支持
│   │   └── orders/[id]/ai-retouch/route.ts  # AI 修图 API
│   ├── orders/
│   │   ├── [id]/
│   │   │   ├── layout.tsx       # 订单详情 8 步导航
│   │   │   ├── page.tsx         # ① 订单摘要（含取消按钮）
│   │   │   ├── upload/          # ④ 原图上传
│   │   │   ├── ai-retouch/      # ⑤ AI 修图（一类修片）
│   │   │   ├── negatives/       # ⑥ 修图底片
│   │   │   ├── finals/          # ⑦ 成片管理
│   │   │   └── email/           # ⑧ 邮件发送
│   │   └── new/                 # 新建订单
│   └── photos/                  # 照片总览
├── components/
│   ├── ui/                      # shadcn/ui 组件
│   │   ├── select.tsx           # 下拉框（SelectTrigger bg-white）
│   │   ├── dialog.tsx           # 弹窗（bg-white + 无遮罩）
│   │   └── ...
│   ├── orders/
│   │   ├── thumb-card.tsx        # 缩略图卡片（像素尺寸+下载）
│   │   ├── image-preview.tsx     # 全屏大图预览
│   │   ├── photo-grid.tsx        # 照片网格
│   │   └── cancel-order-button.tsx
│   └── ai-retouch/
│       ├── params-panel.tsx      # 修图参数面板
│       └── before-after.tsx      # 前后对比组件
├── lib/
│   ├── ai.ts                    # AI 修图引擎（sharp + chroma-key）
│   ├── r2.ts                    # OSS 客户端（ali-oss SDK）
│   └── db.ts                    # Prisma 客户端
└── types/
    └── ali-oss.d.ts             # ali-oss 类型声明
```

---

## 五、踩坑记录与经验

### 坑 1：Vercel 环境变量 type 必须用 "encrypted"
- ❌ `type: "secret"` → Vercel API 返回 400
- ✅ 有效值：`system`, `encrypted`, `plain`, `sensitive`
- 教训：看 Vercel API 文档的错误信息

### 坑 2：Prisma 在 Vercel 上初始化失败
- `postinstall` 脚本必须有 `prisma generate`
- `build` 脚本必须包含 `npx prisma db push`（Vercel 不用 start 脚本）
- 教训：Vercel 的 Next.js 运行时只执行 build 脚本

### 坑 3：Tailwind CSS 变量与 oklch 不兼容（全局透明 Bug）
- ❌ `tailwind.config.ts` 用 `hsl(var(--popover))` 包装，但 CSS 变量值是 `oklch(1 0 0)`
- 浏览器无法解析 `hsl(oklch(1 0 0))` → 背景全变透明
- ✅ 去掉 `hsl()` 包装，直接用 `var(--popover)`
- **这是所有下拉框/弹窗/卡片透明的根因，一个文件修复全局**

### 坑 4：AWS S3 SDK 不兼容阿里云 OSS
- ❌ `@aws-sdk/client-s3` 的各种 endpoint 格式在阿里云上报错
- ✅ 改用官方 `ali-oss` SDK（v6.23.0）
- 需手动写 `src/types/ali-oss.d.ts` 类型声明

### 坑 5：浏览器直接 PUT 到 OSS → CORS 错误
- ❌ 浏览器无法跨域 PUT 到 OSS
- ✅ 改为服务端上传代理 `/api/upload/route.ts`
- 客户端用 FormData POST 到自己的 API，服务端用 ali-oss SDK put

### 坑 6：OSS 签名 URL 是 http:// → 混合内容阻断
- ❌ `oss.signatureUrl()` 生成 http URL，HTTPS 页面被浏览器拦截
- ✅ 用 `oss.get(key)` 拿 Buffer → Uint8Array → NextResponse 代理返回
- `/api/files/proxy` 是图片代理 + 下载的核心

### 坑 7：Bucket 名称错误
- ❌ 代码里写 `photo-studio`，实际是 `photo-studio-muji`
- 教训：先确认实际资源名称再写代码

### 坑 8：下载按钮不触发浏览器下载
- ❌ 只有 `href` 没有 `download` 属性
- ✅ `<a href="..." download={fileName}>`
- 服务端加 `Content-Disposition: attachment` header

### 坑 9：sharp.tint() 毁图
- ❌ `sharp.tint({r:255,g:255,b:255})` 把整张照片洗成灰白
- ✅ 改为色度键（chroma-key）背景分离算法
- 采样四角边缘 → 检测原背景色 → 逐像素色差计算 → 羽化过渡 → `flatten()` 换新背景

### 坑 10：React 闭包陷阱 → 提交修图处理 0 张
- ❌ `handleSubmit` 只处理 `'待处理'` 状态，但旧 API 已在 DB 创建了 `AI_RESULT` 记录
- 页面加载时 `buildInitialPairs` 把这些旧记录匹配为 `'完成'`
- ✅ 改为处理所有非 `'处理中'` 的图片

### 坑 11：curl 被 http_proxy 代理劫持
- Windows 环境下 `curl localhost:3002` 走了 `127.0.0.1:7897` 代理
- ✅ `curl --noproxy localhost "http://localhost:3002/"`

---

## 六、已完成功能

- [x] 订单 CRUD（创建、列表、详情、取消）
- [x] 订单 8 步工作流导航
- [x] 原图上传（服务端代理 → OSS）
- [x] 图片代理显示（/api/files/proxy → oss.get()）
- [x] 图片下载（Content-Disposition + download 属性）
- [x] 缩略图卡片（像素尺寸、文件大小、下载按钮）
- [x] 全屏大图预览（ImagePreview）
- [x] 成片管理（finals 上传和展示）
- [x] 修图底片展示
- [x] 照片总览页面
- [x] AI 修图（一类修片）— 真实图像处理
  - [x] 亮度调整（sharp.modulate）
  - [x] 清晰度增强（sharp.sharpen）
  - [x] 肤色匀称/磨皮（blur + sharpen 模拟双边滤波）
  - [x] 背景色替换（chroma-key 色度键检测 + flatten）
- [x] 全局透明 UI 修复（tailwind.config.ts hsl→var）
- [x] Select/Dialog 等 shadcn 组件实色背景
- [x] 取消订单按钮 + 确认弹窗
- [x] 取消订单弹窗无遮罩（bg-transparent overlay）
- [x] Vercel 环境变量配置
- [x] 邮箱 SMTP 配置

---

## 七、未完成 / 待测试

- [ ] **AI 修图背景替换效果验证** — chroma-key 算法已实现，需用真实影棚照片测试准确率
- [ ] **AI 修图处理速度** — Vercel Hobby 计划有 10 秒超时，大尺寸照片可能超时
- [ ] **邮件发送功能** — SMTP 已配置，但邮件模板和发送逻辑需测试
- [ ] **账单/收款页面** — ③ 账单/收款可能还未完整实现
- [ ] **客户信息页面** — ② 客户信息需确认完整性
- [ ] **sharp 在 Vercel 上的运行时兼容性** — 已部署但未生产级验证
- [ ] **订单状态流转自动化** — 部分状态变更可能仍需手动触发
- [ ] **图片删除功能** — 暂无删除已上传照片的功能
- [ ] **批量操作** — 暂无批量上传/下载/删除

---

## 八、Prisma 数据模型关键字段

```prisma
model Order {
  id        String   @id @default(cuid())
  orderNo   String   @unique
  status    String   @default("已创建")  // 已创建→已拍摄→AI修图中→修图完成→已完成/已取消
  shootTime DateTime?
  files     OrderFile[]
  // ... customer info, billing fields
}

model OrderFile {
  id       String   @id @default(cuid())
  orderId  String
  fileName String
  fileUrl  String
  fileSize BigInt
  fileType FileType  // ORIGINAL | AI_RESULT | FINAL | NEGATIVE
  aiParams Json?
}
```

---

## 九、后续工作建议

1. **新对话启动方式**：告诉 Claude "继续 photo-studio-admin 项目开发"，附上本文档路径 `d:\VSCodeCache\code\Code\photo-studio-admin\PROJECT_HANDOFF.md`
2. **每次部署后**：等待 Vercel 构建完成（约 1-2 分钟），然后测试
3. **本地测试优先**：`npm run dev` → `curl --noproxy localhost` 验证
4. **TypeScript 检查**：提交前跑 `npx tsc --noEmit`
5. **不要直接改 Vercel 上的代码**：通过 Git push 部署

---

## 十、Git 提交历史（最近 6 次）

```
3edcae4 fix: 移除有害的tint()背景替换,实现真正的色度键(chroma-key)背景分离
a2561a3 fix: 提交修图处理全部图片(不仅是待处理) + 已完成可重新修图
f4018a7 fix: AI修图API增强 - 详细错误日志 + 健壮OSS key提取 + 客户端错误展示
b5d107e fix: AI修图结果 - 代理URL + 300px大缩略图 + 点击放大 + 下载
44add32 feat: 实现真正的AI修图功能 - sharp服务端图像处理
670ade9 fix: 修复所有下拉框/弹窗透明问题 - hsl()与oklch()不兼容
```
