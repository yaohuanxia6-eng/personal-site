'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { DiaryEntry } from '@/types'
import { useToast } from '@/components/ui/toast'
import { apiFetch } from '@/lib/api'

export default function DiaryHistoryPage() {
  const toast = useToast()
  const router = useRouter()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/diary')
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
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center text-primary -ml-1 p-1">
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">过往日记</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y space-y-3">
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
            <span className="text-4xl mb-3">📝</span>
            <p className="text-body-md text-text-muted">还没有写过日记</p>
            <p className="text-body-sm text-text-muted mt-1">写下第一篇日记，开始了解自己的情绪</p>
            <button
              onClick={() => router.push('/toolkit/diary')}
              className="mt-5 px-6 py-2.5 bg-primary text-white text-body-sm font-medium rounded-button hover:bg-primary/90 transition-colors"
            >
              开始写日记
            </button>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-surface rounded-card border border-border shadow-card p-4">
              {/* Date & mood */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{entry.mood_emoji ?? entry.mood}</span>
                  <span className="text-body-sm text-text-secondary font-medium">{entry.mood_label ?? entry.mood}</span>
                </div>
                <span className="text-label text-text-muted">{formatDate(entry.created_at)}</span>
              </div>

              {/* Content */}
              <div className="space-y-2 text-body-sm text-text-primary">
                {entry.mode === 'guided' ? (
                  <>
                    {(entry.event || entry.content?.what_happened) && (
                      <div>
                        <span className="text-text-muted">发生了什么：</span>
                        <span>{entry.event || entry.content?.what_happened}</span>
                      </div>
                    )}
                    {(entry.body_reaction || entry.content?.body_reaction) && (
                      <div>
                        <span className="text-text-muted">身体反应：</span>
                        <span>{entry.body_reaction || entry.content?.body_reaction}</span>
                      </div>
                    )}
                    {(entry.thought || entry.content?.thoughts) && (
                      <div>
                        <span className="text-text-muted">脑海里的想法：</span>
                        <span>{entry.thought || entry.content?.thoughts}</span>
                      </div>
                    )}
                    {(entry.self_talk || entry.content?.self_talk) && (
                      <div>
                        <span className="text-text-muted">对自己说：</span>
                        <span>{entry.self_talk || entry.content?.self_talk}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p>{entry.free_text || entry.content?.free_text}</p>
                )}
              </div>

              {/* Export button */}
              <button
                onClick={() => toast.show('导出功能即将上线', 'info')}
                className="mt-3 text-body-sm text-primary hover:underline underline-offset-2"
              >
                导出这篇
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
