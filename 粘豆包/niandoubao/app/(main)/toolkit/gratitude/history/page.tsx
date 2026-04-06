'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { GratitudeEntry } from '@/types'
import { apiFetch } from '@/lib/api'

export default function GratitudeHistoryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/gratitude')
        if (res.ok) {
          const data = await res.json()
          setEntries(data.data?.items ?? data.items ?? data.entries ?? [])
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center text-primary -ml-1 p-1">
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">过往记录</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y space-y-3">
        <h1 className="font-serif text-[22px] font-bold text-text-primary mb-1">感恩记录详情</h1>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface rounded-card border border-border p-4 animate-pulse">
                <div className="h-4 bg-surface-2 rounded w-1/3 mb-3" />
                <div className="h-3 bg-surface-2 rounded w-2/3 mb-2" />
                <div className="h-3 bg-surface-2 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-4xl mb-3">🌟</span>
            <p className="text-body-md text-text-muted">还没有感恩记录</p>
            <p className="text-body-sm text-text-muted mt-1">开始记录生活中的美好吧</p>
            <button
              onClick={() => router.push('/toolkit/gratitude')}
              className="mt-5 px-6 py-2.5 bg-primary text-white text-body-sm font-medium rounded-button hover:bg-primary/90 transition-colors"
            >
              记录今天的美好
            </button>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-surface rounded-card border border-border shadow-card p-4">
              {/* Date & count */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-body-sm text-text-secondary font-medium">
                  {formatDate(entry.created_at)}
                </span>
                <span className="text-label text-primary bg-primary/[0.08] rounded-chip px-2 py-0.5">
                  {entry.items.length} 件好事
                </span>
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {entry.items.map((item, i) => (
                  <p key={i} className="text-body-sm text-text-primary">
                    <span className="text-text-muted mr-1.5">{i + 1}.</span>
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
