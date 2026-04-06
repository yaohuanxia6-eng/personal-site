// lib/deepseek/client.ts
// 使用 OpenAI SDK 兼容接口，支持 Kimi / DeepSeek

import OpenAI from 'openai'

// Kimi (MoonShot) API
export const aiClient = new OpenAI({
  apiKey: process.env.KIMI_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? 'sk-placeholder',
  baseURL: process.env.KIMI_BASE_URL ?? process.env.DEEPSEEK_BASE_URL ?? 'https://api.moonshot.cn/v1',
})

export const CHAT_MODEL = process.env.AI_MODEL ?? 'moonshot-v1-8k'
