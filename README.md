# YHX.io - Personal Site & Projects

> AI Product Manager 的个人站点，包含个站主页、粘豆包 AI 情绪陪伴产品（全栈）、色彩炼金小游戏、简历筛选平台原型。

**在线访问**：[http://175.24.132.35](http://175.24.132.35)

---

## 项目结构

```
.
├── index.html                 # 个站主页（静态 HTML，CSS/JS 内联）
├── assets/                    # 字体、图片等静态资源
├── 色彩炼金/                   # 色彩混合小游戏（纯前端）
├── 简历筛选平台/               # 简历筛选平台（高保真原型 + 产品文档）
└── 粘豆包/                     # AI 情绪陪伴产品（全栈，V1.4）
    ├── niandoubao/            # Next.js 14 前端
    ├── api/zhandoubao/        # FastAPI 后端
    ├── database/              # 数据库 Schema
    └── 产品文档/               # 7 份产品文档（HTML）
```

---

## 粘豆包 NianDouBao V1.4

一款面向 18-30 岁青年的 AI 情绪陪伴产品，从产品设计到全栈开发独立完成。

### 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Next.js 14, React 18, Tailwind CSS, TypeScript |
| 后端 | FastAPI (Python), aiomysql |
| 数据库 | MySQL 8.0 |
| 认证 | Supabase Auth (ES256 JWT) |
| AI | Kimi API (moonshot-v1-8k / vision-preview) |
| 部署 | 腾讯云 + Nginx + systemd |

### 核心功能

- **AI 对话**：MBTI 个性化 Prompt，流式 SSE 输出，分段格式化渲染
- **图片识别**：多图上传（最多5张），前端压缩 + 缩略图持久化，Kimi Vision API
- **每日记忆**：AI 生成日记式总结，每天一条，保留30天
- **情绪签到**：6种心情 + 30天日历可视化 + 情绪分布统计
- **微行动系统**：AI 建议5-15分钟小行动，内联显示，跟踪完成率
- **心理工具箱**：4-7-8呼吸、情绪日记、认知重构（AI分析）、五感扎根、安全计划、感恩记录
- **MBTI 人格**：16型人格特质展示 + 聊天风格适配
- **认知重构**：用户填写后调用 AI 做真实认知偏差分析（/cbt/analyze）
- **回归问候**：离开App 3分钟回来时 AI 主动打招呼

### 架构亮点

- **认证优化**：Next.js API Route 用 JWT 本地解码替代 `getUser()` 网络请求，图片识别响应提速 1-3 秒
- **Middleware 加速**：`getSession()` 本地验证替代 `getUser()`，页面跳转零网络等待
- **图片双轨压缩**：600px 发 API 识别，120px 缩略图存 MySQL，兼顾速度和持久化
- **API 响应统一**：后端 `ApiResponse{code, data, msg}` 格式，前端 `data.data ?? data` 兼容

### 产品文档

7 份完整产品文档，可在线查看：[粘豆包产品文档](http://175.24.132.35/粘豆包/产品文档/)

1. 产品定位文档
2. 竞品分析
3. 用户调研与画像
4. PRD 产品需求文档
5. AI Prompt 策略与评测
6. 信息架构与流程图
7. V1.4 版本更新说明

---

## 色彩炼金

纯前端色彩混合小游戏，HTML + CSS + JS，无框架依赖。

- 8种基础色 + 4个试管实验
- RGB通道混色算法
- 色卡收藏（localStorage）
- 响应式三断点适配

---

## 本地开发

### 粘豆包前端
```bash
cd 粘豆包/niandoubao
npm install
cp .env.example .env.local  # 填入 Supabase 和 Kimi API 配置
npm run dev
```

### 粘豆包后端
```bash
cd 粘豆包/api/zhandoubao
pip install -r requirements.txt
cp .env.example .env  # 填入 MySQL 和 Kimi API 配置
uvicorn app:app --port 8091
```

---

## License

This project is for portfolio demonstration purposes.
