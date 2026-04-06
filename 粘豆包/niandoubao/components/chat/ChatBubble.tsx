'use client'
import React from 'react'

interface ChatBubbleProps {
  role: 'ai' | 'user'
  content: string
  isStreaming?: boolean
  imageUrl?: string
  timestamp?: string
}

function formatTime(ts?: string): string {
  if (!ts) return ''
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

/** 清理 markdown 符号 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')        // *italic* → italic
    .replace(/^#{1,3}\s+/gm, '')        // ### heading → heading
    .replace(/```[\s\S]*?```/g, '')     // code blocks
    .replace(/`(.+?)`/g, '$1')         // inline code
}

/** 将 AI 回复格式化为结构化的 React 节点 */
function formatAIContent(raw: string): React.ReactNode {
  const text = cleanMarkdown(raw)

  // 按换行分割，过滤空行但记录空行位置（用于段间距）
  const lines = text.split('\n')
  const blocks: { type: 'text' | 'numbered' | 'gap'; content: string; num?: string }[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      // 空行 → 段间距
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'gap') {
        blocks.push({ type: 'gap', content: '' })
      }
      continue
    }
    // 数字编号行：1. xxx / 1、xxx / 1．xxx
    const numMatch = trimmed.match(/^(\d+)[.、．)\]]\s*(.+)/)
    if (numMatch) {
      blocks.push({ type: 'numbered', content: numMatch[2], num: numMatch[1] })
    } else {
      blocks.push({ type: 'text', content: trimmed })
    }
  }

  // 去掉末尾的 gap
  while (blocks.length > 0 && blocks[blocks.length - 1].type === 'gap') {
    blocks.pop()
  }

  // 单行短文本直接返回
  if (blocks.length === 1 && blocks[0].type === 'text') {
    return <span>{blocks[0].content}</span>
  }

  return (
    <div className="space-y-0">
      {blocks.map((block, i) => {
        if (block.type === 'gap') {
          return <div key={i} className="h-2.5" />
        }
        if (block.type === 'numbered') {
          return (
            <div key={i} className="flex gap-1.5 items-start py-0.5">
              <span className="text-primary/70 font-medium flex-shrink-0 min-w-[1.2em] text-right">{block.num}.</span>
              <span>{block.content}</span>
            </div>
          )
        }
        return <p key={i} className="py-0.5">{block.content}</p>
      })}
    </div>
  )
}

export function ChatBubble({ role, content, isStreaming, imageUrl, timestamp }: ChatBubbleProps) {
  const time = formatTime(timestamp)

  if (role === 'ai') {
    return (
      <div className="flex flex-col animate-bubble-in">
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-[20px] px-4 py-3 text-[15px] leading-[1.8] text-text-primary shadow-card max-w-[85%]">
          {formatAIContent(content)}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[15px] bg-primary ml-0.5 align-middle animate-pulse" />
          )}
        </div>
        {time && <span className="text-[11px] text-text-muted/50 mt-1 ml-1">{time}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end animate-bubble-in">
      <div className="bg-primary/[0.10] backdrop-blur-sm border border-primary/[0.06] rounded-[20px] px-4 py-3 text-[15px] leading-[1.8] text-text-primary max-w-[85%]">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="用户上传"
            className="max-w-full max-h-48 rounded-lg mb-2 object-cover"
          />
        )}
        {!imageUrl && /^\[.*图片.*\]$/.test(content) ? (
          <span className="text-text-muted">📷 {content}</span>
        ) : (
          content !== '[图片]' && !(/^\[\d+张图片\]$/.test(content)) && content
        )}
      </div>
      {time && <span className="text-[11px] text-text-muted/50 mt-1 mr-1">{time}</span>}
    </div>
  )
}
