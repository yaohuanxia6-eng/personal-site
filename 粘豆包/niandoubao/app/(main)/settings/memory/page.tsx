'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface MemoryEntry {
  fact: string
  category: string
  date?: string
  updated_at?: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  日常: '📝',
  压力: '😤',
  人际: '🤝',
  成长: '🌱',
  情绪: '🌊',
  压力源: '😤',
  人际关系: '🤝',
  近期困境: '🌧',
  有效策略: '✨',
  其他: '📌',
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const w = weekdays[d.getDay()]
  return `${m}月${day}日 周${w}`
}

export default function MemoryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/memory')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.data?.key_facts ?? data.key_facts ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-primary -ml-1 p-1"><ChevronLeft size={22} /></button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">粘豆包的记忆</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y max-w-md mx-auto w-full">
        <p className="text-body-sm text-text-muted mb-4">粘豆包记住的关于你的每一天：</p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-card p-4 animate-pulse">
                <div className="h-3 bg-surface-2 rounded w-1/3 mb-2" />
                <div className="h-3 bg-surface-2 rounded w-full mb-1.5" />
                <div className="h-3 bg-surface-2 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-4xl mb-3">🫘</span>
            <p className="text-body-md text-text-muted">聊得越多，我对你的了解就越深</p>
            <p className="text-body-sm text-text-muted mt-1">每天聊天结束后，粘豆包会自动总结当天的重点</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, i) => (
              <div key={i} className="bg-surface rounded-card shadow-card p-4">
                {/* 日期 + 分类标签 */}
                <div className="flex items-center justify-between mb-2.5">
                  {entry.date && (
                    <span className="text-body-sm text-text-secondary font-medium">
                      {formatDate(entry.date)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] bg-primary/[0.08] text-primary rounded-full px-2.5 py-0.5">
                    {CATEGORY_EMOJI[entry.category] ?? '📌'} {entry.category}
                  </span>
                </div>
                {/* 详细内容（支持换行） */}
                <div className="text-body-sm text-text-primary leading-relaxed whitespace-pre-line">
                  {entry.fact}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
