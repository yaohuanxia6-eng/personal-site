'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface MemoryEntry {
  type?: 'core' | 'daily'
  fact: string
  category: string
  date?: string
  updated_at?: string
}

const CORE_EMOJI: Record<string, string> = {
  人物: '👤',
  状态: '📋',
  事件: '📅',
  策略: '💡',
}

const DAILY_EMOJI: Record<string, string> = {
  日常: '📝',
  压力: '😤',
  人际: '🤝',
  成长: '🌱',
  情绪: '🌊',
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
  const [coreFacts, setCoreFacts] = useState<MemoryEntry[]>([])
  const [dailyFacts, setDailyFacts] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/memory')
      if (res.ok) {
        const data = await res.json()
        const d = data.data ?? data
        setCoreFacts(d.core_facts ?? [])
        setDailyFacts(d.key_facts ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const isEmpty = coreFacts.length === 0 && dailyFacts.length === 0

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-primary -ml-1 p-1"><ChevronLeft size={22} /></button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">粘豆包的记忆</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y max-w-md mx-auto w-full">
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
        ) : isEmpty ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-4xl mb-3">🫘</span>
            <p className="text-body-md text-text-muted">聊得越多，我对你的了解就越深</p>
            <p className="text-body-sm text-text-muted mt-1">粘豆包会自动记住关于你的重要事情</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── 长期记忆 ── */}
            {coreFacts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🧠</span>
                  <h2 className="text-body-md font-medium text-text-primary">永久记忆</h2>
                  <span className="text-[11px] text-text-muted bg-surface-2 rounded-full px-2 py-0.5">{coreFacts.length}条</span>
                </div>
                <p className="text-[12px] text-text-muted mb-3">这些是粘豆包永远记得的关于你的事</p>
                <div className="space-y-2">
                  {coreFacts.map((entry, i) => (
                    <div key={`core-${i}`} className="bg-surface rounded-card shadow-card p-3.5 border-l-3 border-l-primary/40" style={{ borderLeftWidth: 3 }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[13px]">{CORE_EMOJI[entry.category] ?? '📌'}</span>
                        <span className="text-[11px] text-primary font-medium">{entry.category}</span>
                      </div>
                      <p className="text-body-sm text-text-primary leading-relaxed">{entry.fact}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── 每日总结 ── */}
            {dailyFacts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📖</span>
                  <h2 className="text-body-md font-medium text-text-primary">每日记录</h2>
                  <span className="text-[11px] text-text-muted bg-surface-2 rounded-full px-2 py-0.5">近30天</span>
                </div>
                <div className="space-y-3">
                  {dailyFacts.map((entry, i) => (
                    <div key={`daily-${i}`} className="bg-surface rounded-card shadow-card p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        {entry.date && (
                          <span className="text-body-sm text-text-secondary font-medium">
                            {formatDate(entry.date)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] bg-primary/[0.08] text-primary rounded-full px-2.5 py-0.5">
                          {DAILY_EMOJI[entry.category] ?? '📌'} {entry.category}
                        </span>
                      </div>
                      <div className="text-body-sm text-text-primary leading-relaxed whitespace-pre-line">
                        {entry.fact}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
