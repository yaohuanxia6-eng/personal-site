// app/api/chat/route.ts — Kimi 流式对话接口（图片识别专用，消息通过后端持久化到 MySQL）

import { NextRequest, NextResponse } from 'next/server'
import { aiClient, CHAT_MODEL } from '@/lib/deepseek/client'
import { detectCrisis } from '@/lib/crisis/detector'
import { EmotionType } from '@/types'

export const runtime = 'nodejs'

// 增加超时时间（Kimi vision 可能需要更长时间）
export const maxDuration = 60

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8091/api/zhandoubao'

// 频率限制
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

function detectEmotionFromText(text: string): EmotionType | null {
  if (text.includes('焦虑') || text.includes('紧张')) return '焦虑'
  if (text.includes('低落') || text.includes('难过') || text.includes('沮丧') || text.includes('悲伤')) return '低落'
  if (text.includes('愉悦') || text.includes('开心') || text.includes('高兴') || text.includes('喜悦')) return '愉悦'
  if (text.includes('平静') || text.includes('平和') || text.includes('还不错') || text.includes('挺好')) return '平静'
  if (text.includes('空虚') || text.includes('迷茫') || text.includes('无聊') || text.includes('空洞')) return '空虚'
  if (text.includes('混乱') || text.includes('烦躁') || text.includes('纠结') || text.includes('烦乱')) return '混乱'
  return null
}

function extractMicroAction(text: string): string | null {
  const patterns = [
    /今天可以[：:]\s*(.+?)(?:\n|$)/,
    /微行动[：:]\s*(.+?)(?:\n|$)/,
    /试着(.{6,30})(?:\n|$)/,
    /可以试试(.{4,25})(?:\n|$)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim()
  }
  return null
}

/** 从 JWT 中解码 payload 获取 user_id，不做网络验证（节省 1-3 秒） */
function decodeJwtPayload(token: string): { sub?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
    // 检查是否过期
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  // 从 Authorization header 解码 JWT，不发网络请求验证（大幅提速）
  const authHeader = req.headers.get('Authorization')
  let accessToken: string | null = null
  let userId: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    accessToken = authHeader.slice(7)
    const payload = decodeJwtPayload(accessToken)
    userId = payload?.sub ?? null
  }

  if (!userId || !accessToken) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: '请求太频繁，请稍后再试' }, { status: 429 })
  }

  const { messages, session_id, useVision } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: unknown }[]
    session_id?: string
    useVision?: boolean
  }

  if (messages.length > 30) {
    return NextResponse.json({ error: '对话太长了，开启新对话吧' }, { status: 400 })
  }
  const lastMsg = messages[messages.length - 1]
  const lastMsgText = typeof lastMsg?.content === 'string' ? lastMsg.content : '[图片消息]'

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' && typeof m.content === 'string')
  const crisis = lastUserMsg && typeof lastUserMsg.content === 'string' ? detectCrisis(lastUserMsg.content) : false

  // 图片识别用轻量 system prompt，减少 token 消耗
  const systemPrompt = useVision
    ? '你是粘豆包，一个温柔的情绪陪伴伙伴。用户发了一张图片，请简短温暖地回应（80字以内），可以描述图片内容，也可以结合图片聊聊感受。'
    : '你是粘豆包，一个温柔的情绪陪伴伙伴。每条回复80字以内。'

  const model = useVision ? 'moonshot-v1-8k-vision-preview' : CHAT_MODEL

  let stream
  try {
    // 图片识别只发最后一条消息（含图片），不带历史，大幅减少请求体积
    const apiMessages = useVision
      ? [
          { role: 'system' as const, content: systemPrompt },
          messages[messages.length - 1] as Parameters<typeof aiClient.chat.completions.create>[0]['messages'][number],
        ]
      : [
          { role: 'system' as const, content: systemPrompt },
          ...messages as Parameters<typeof aiClient.chat.completions.create>[0]['messages'],
        ]

    stream = await aiClient.chat.completions.create({
      model,
      stream: true,
      temperature: 0.8,
      max_tokens: useVision ? 300 : 200,
      messages: apiMessages,
    })
  } catch (e) {
    console.error('[chat] Kimi API error:', e)
    return NextResponse.json({ error: 'AI 服务暂时不可用，请稍后重试' }, { status: 502 })
  }

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      if (crisis) {
        controller.enqueue(encoder.encode(`data: {"crisis":true}\n\n`))
      }

      let accumulated = ''
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          accumulated += delta
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`))
        }
        if (chunk.choices[0]?.finish_reason === 'stop') {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        }
      }

      // 流结束后持久化到 MySQL
      if (session_id && accessToken) {
        try {
          const getRes = await fetch(`${API}/sessions/today`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          const sessionData = await getRes.json()
          const existing = sessionData?.data?.messages ?? sessionData?.messages ?? []

          const ts = new Date().toISOString()
          const updated = [
            ...existing,
            { role: 'user', content: lastMsgText, timestamp: ts },
            { role: 'ai', content: accumulated, timestamp: ts },
          ]

          const microAction = extractMicroAction(accumulated)
          const emotionType = crisis ? '危机' : detectEmotionFromText(accumulated)

          await fetch(`${API}/sessions/${session_id}/messages`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: updated,
              micro_action: microAction,
              emotion_type: emotionType,
            }),
          })
        } catch (e) {
          console.error('[chat] save error:', e)
        }
      }

      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
