# YHX.io — Personal Site & Projects

AI 产品经理的个人站点，包含三个独立项目的完整源码与产品文档。

**在线访问**：[http://175.24.132.35](http://175.24.132.35)

---

## 项目一览

### 粘豆包 NianDouBao `V1.4`
AI 情绪陪伴产品，从产品设计到全栈开发独立完成。

`Next.js 14` `FastAPI` `MySQL` `Kimi API` `Supabase Auth` `Tailwind CSS`

- MBTI 个性化 AI 对话（流式输出、分段格式化）
- 多图识别（Kimi Vision，前端压缩+缩略图持久化）
- 每日记忆总结 · 情绪签到 · 微行动系统 · 6个心理工具
- 7 份产品文档：[在线查看](http://175.24.132.35/粘豆包/产品文档/)

### 色彩炼金 Color Alchemy
纯前端色彩混合小游戏，无框架依赖。

`HTML` `CSS` `JavaScript`

- 8 种基础色 × 4 个试管实验 · RGB 混色算法 · 色卡收藏 · 响应式适配

### 简历筛选平台
AI 智能简历筛选平台（产品设计阶段，含高保真原型）。

- 7 份产品文档 + 交互原型

---

## 本地开发

```bash
# 粘豆包前端
cd 粘豆包/niandoubao && npm install && npm run dev

# 粘豆包后端
cd 粘豆包/api/zhandoubao && pip install -r requirements.txt && uvicorn app:app --port 8091
```

> 需要配置环境变量（Supabase、Kimi API、MySQL），详见各目录下的 `.env.example`。

---

## License

This project is for portfolio demonstration purposes.
