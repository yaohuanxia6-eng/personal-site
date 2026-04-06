# 粘豆包 NianDouBao

> AI 情感陪伴 App — 面向 18-28 岁年轻女性的情绪签到 + AI 引导对话 + 微行动建议 + 心理工具箱

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS | App Router, 'use client' 模式 |
| UI 组件 | shadcn/ui + lucide-react | 自定义暖棕色设计系统 |
| 认证 | Supabase Auth | 邮箱+密码登录，JWT 验证 |
| 后端 | FastAPI (Python) | 异步，端口 8091 |
| 数据库 | MySQL (aiomysql) | 异步连接池 |
| AI 模型 | Kimi (moonshot-v1-8k) | 通过 OpenAI SDK 调用，可切换 DeepSeek |
| 部署 | Vercel (前端) + 自建服务器 (后端) | basePath: /projects/zhandoubao |

## 项目结构

```
粘豆包/
├── api/zhandoubao/           # FastAPI 后端
│   ├── app.py                # 入口，注册 11 个路由
│   ├── auth.py               # Supabase JWT 验证
│   ├── database.py           # MySQL 异步连接池
│   ├── models.py             # 所有 Pydantic 模型
│   ├── deploy.sh             # 部署脚本
│   ├── init_db.py            # 数据库初始化
│   └── routers/
│       ├── health.py         # 健康检查
│       ├── sessions.py       # 每日会话 CRUD
│       ├── chat.py           # AI 对话 (SSE 流式)
│       ├── memory.py         # 记忆提炼系统
│       ├── profile.py        # 用户资料
│       ├── mbti.py           # MBTI 偏好
│       ├── diary.py          # 情绪日记
│       ├── safety_plan.py    # 安全计划
│       ├── gratitude.py      # 感恩记录
│       ├── cbt.py            # 认知重构
│       └── emotion.py        # 情绪记录
│
├── niandoubao/               # Next.js 前端
│   ├── app/
│   │   ├── (auth)/login/     # 登录页
│   │   ├── (main)/
│   │   │   ├── chat/         # 聊天主页 (连续对话，按日期分组)
│   │   │   ├── toolkit/      # 工具箱
│   │   │   │   ├── page.tsx  # 6工具网格
│   │   │   │   ├── breathing/    # 4-7-8 呼吸练习
│   │   │   │   ├── diary/        # 情绪日记 + history/
│   │   │   │   ├── cbt/          # 认知重构
│   │   │   │   ├── grounding/    # 感官落地 5-4-3-2-1
│   │   │   │   ├── safety-plan/  # 安全计划
│   │   │   │   └── gratitude/    # 感恩记录 + history/
│   │   │   ├── history/      # 情绪记录 (日历+趋势+统计)
│   │   │   ├── settings/     # 我的 (卡片式布局)
│   │   │   │   ├── profile/      # 个人信息编辑
│   │   │   │   ├── memory/       # 粘豆包的记忆
│   │   │   │   └── reminder/     # 每日提醒设置
│   │   │   ├── onboarding/   # MBTI 引导页
│   │   │   └── layout.tsx    # 主布局 (含 BottomNav)
│   │   ├── api/              # Next.js API 代理路由
│   │   │   └── weather/      # 天气 API (wttr.in)
│   │   ├── privacy/          # 隐私政策
│   │   └── terms/            # 用户协议
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   ├── layout/AppHeader.tsx, BottomNav.tsx
│   │   ├── chat/ChatBubble, ChatInput, MicroActionCard, CrisisCard
│   │   └── ui/               # shadcn 基础组件
│   ├── lib/
│   │   ├── supabase/client.ts, server.ts, admin.ts
│   │   ├── deepseek/client.ts, prompts.ts
│   │   └── crisis/detector.ts
│   └── types/index.ts
│
└── database/schema.sql       # 数据库建表 SQL (7张新表)
```

## 数据库表

| 表名 | 说明 | 状态 |
|------|------|------|
| `user_profiles` | 用户资料 (id, email, nickname, reminder_*) | ✅ 已有 |
| `sessions` | 每日会话 (messages JSON, emotion_type, micro_action) | ✅ 已有 |
| `memory_summary` | AI 记忆 (key_facts JSON, 最多10条) | ✅ 已有 |
| `user_mbti` | MBTI 偏好 (ei, sn, tf, jp, mbti_type) | 🆕 schema.sql |
| `diary_entries` | 情绪日记 (mode, event, body_reaction, thought, self_talk, mood) | 🆕 schema.sql |
| `safety_plans` | 安全计划 (signals, self_help, contacts, meaning) | 🆕 schema.sql |
| `gratitude_entries` | 感恩记录 (items JSON, day_number) | 🆕 schema.sql |
| `cbt_records` | 认知重构 (thought, score_before/after, reframe, observation) | 🆕 schema.sql |
| `emotion_records` | 每日情绪 (emotion, sub_emotion, score, record_date) | 🆕 schema.sql |
| `grounding_sessions` | 感官落地 (steps_data JSON) | 🆕 schema.sql |

## 本地开发

```bash
# 1. 数据库 — 执行新表建表
mysql -u root < database/schema.sql

# 2. 后端
cd api/zhandoubao
cp .env.example .env  # 填入实际值
pip install -r requirements.txt
python app.py  # 端口 8091

# 3. 前端
cd niandoubao
cp .env.example .env.local  # 填入实际值
npm install
npm run dev -- --port 3002
```

> **注意**：本地开发时可临时注释 `next.config.mjs` 中的 `basePath: '/projects/zhandoubao'`，否则需带前缀访问。

## 环境变量

### 后端 (`api/zhandoubao/.env`)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=xxx
DB_NAME=zhandoubao

SUPABASE_JWT_SECRET=xxx

KIMI_API_KEY=xxx
KIMI_BASE_URL=https://api.moonshot.cn/v1
AI_MODEL=moonshot-v1-8k
```

### 前端 (`niandoubao/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

NEXT_PUBLIC_API_URL=http://localhost:8091/api/zhandoubao

KIMI_API_KEY=xxx
KIMI_BASE_URL=https://api.moonshot.cn/v1
AI_MODEL=moonshot-v1-8k
```

## 核心功能

- **连续对话**：打开 App 看到历史消息（按日期分组），每天根据天气+时段生成诗意问候
- **AI 记忆**：从对话中提炼关键事实 (5类，共≤10条)，每次对话注入 System Prompt
- **微行动闭环**：签到后给 1 个微行动，次日 AI 追问反馈
- **危机检测**：12 个关键词匹配，触发危机卡片 + 专业热线
- **MBTI 个性化**：4 维度选择，影响 AI 风格 (FI/FE/TI/TE)、微行动推荐、工具推荐
- **心理工具箱**：6 工具（呼吸/日记/CBT/落地/安全计划/感恩）
- **情绪追踪**：30 天日历 + 情绪分布 + 连续签到统计

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/PUT | /mbti | MBTI 偏好 |
| POST/GET | /diary | 日记 CRUD |
| GET/DELETE | /diary/{id} | 单条日记 |
| GET/PUT | /safety-plan | 安全计划 |
| POST/GET | /gratitude | 感恩记录 |
| GET | /gratitude/streak | 连续天数 |
| POST/GET | /cbt | 认知重构 |
| GET | /cbt/today | 今日是否已做 |
| POST | /emotion | 记录情绪 |
| GET | /emotion/history | 历史趋势 |
| GET | /emotion/trend | 图表数据 |
| POST | /chat | AI 对话 (SSE) |
| POST | /sessions/today | 获取/创建今日会话 |
| GET | /sessions/yesterday | 昨日会话 |
| POST | /memory/extract | 提炼记忆 |
| GET/PUT | /profile | 用户资料 |

## 设计系统

- **Primary (棕)**: #8B7355
- **Accent (绿)**: #7BAE84
- **Background**: #FBF7F0 (聊天区: #F3ECE0 暖色渐变弥散)
- **Crisis (红)**: #C0392B
- **标题字体**: 'Lora' / 'Noto Serif SC'
- **正文字体**: 'Noto Sans SC' / 'PingFang SC'

## 版本记录

| 版本 | 日期 | 内容 |
|------|------|------|
| V1.0 | 2026-04-02 | 原型完成，产品文档完成 |
| V1.1 | 2026-04-03 | 前后端代码全部补齐，工具箱 6 工具实现，MBTI 引导、底部导航、连续对话系统完成 |
| V1.2 | 2026-04-03 | 文档融合（Prompt+评测），项目清理，UI 截图生成 |
| V1.3 | 2026-04-04 | UI 精致化改版：聊天渐变背景、大圆角气泡、卡片式设置页、天气诗意问候、精致导航栏、设置详情子页面 |
