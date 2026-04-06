'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const ICONS = ['🌸', '🌟', '💖', '🌈', '🍀', '✨', '🦋', '🌻']
const CHALLENGE_DAYS = 21

export default function GratitudePage() {
  const router = useRouter()
  const toast = useToast()
  const [items, setItems] = useState<string[]>(['', '', ''])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [totalDays, setTotalDays] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load total days count
  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/gratitude')
        if (res.ok) {
          const data = await res.json()
          const entries = data.data?.items ?? data.items ?? data.entries ?? []
          setTotalDays(entries.length)
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const anyFilled = items.some((item) => item.trim())

  function addItem() {
    if (items.length < 8) {
      setItems([...items, ''])
    }
  }

  function updateItem(index: number, value: string) {
    const next = [...items]
    next[index] = value
    setItems(next)
  }

  async function handleSave() {
    if (!anyFilled) return
    setSaving(true)
    try {
      const filledItems = items.filter((i) => i.trim())
      await apiFetch('/gratitude', {
        method: 'POST',
        body: JSON.stringify({ items: filledItems }),
      })
      setSaved(true)
      setTotalDays((d) => d + 1)
    } catch {
      toast.show('保存失败，请稍后重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  const progressDays = Math.min(totalDays, CHALLENGE_DAYS)

  if (saved) {
    const filledItems = items.filter((i) => i.trim())
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0">
          <button onClick={() => router.push('/toolkit')} className="flex items-center text-primary -ml-1 p-1">
            <ChevronLeft size={22} />
          </button>
          <span className="flex-1 text-center text-body-md font-medium text-text-primary">感恩记录</span>
          <div className="w-6" />
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y flex flex-col items-center max-w-md mx-auto w-full">
          <div className="bg-surface rounded-card shadow-card border border-border p-6 text-center w-full">
            <span className="text-4xl block mb-3">🌟</span>
            <h2 className="font-serif text-title-md text-primary mb-2">
              今天的美好已记录
            </h2>
            <p className="text-body-sm text-text-secondary mb-3">
              你记下了 {filledItems.length} 件好事
            </p>
            <div className="text-left space-y-1.5">
              {filledItems.map((item, i) => (
                <p key={i} className="text-body-sm text-text-primary">
                  {ICONS[i % ICONS.length]} {item}
                </p>
              ))}
            </div>
          </div>

          <Link
            href="/toolkit/gratitude/history"
            className="mt-6 text-body-sm text-primary hover:underline underline-offset-2"
          >
            过往记录 · 查看详情 →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        <button onClick={() => router.back()} className="flex items-center text-primary -ml-1 p-1">
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">感恩记录</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y space-y-5 max-w-md mx-auto w-full">
        {/* 21-day challenge */}
        <div className="bg-surface rounded-card shadow-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-body-md font-medium text-text-primary">
              21天感恩挑战
            </h3>
            <span className="text-label text-primary bg-primary/[0.08] rounded-chip px-2 py-0.5">
              {loading ? '…' : `${progressDays}/${CHALLENGE_DAYS}`}
            </span>
          </div>
          {/* Progress dots */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from({ length: CHALLENGE_DAYS }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < progressDays ? 'bg-accent' : 'bg-border'
                } ${i === progressDays ? 'animate-pulse' : ''}`}
              />
            ))}
          </div>
          <p className="text-body-sm text-text-muted leading-relaxed">
            坚持21天后，感恩会变成你的思维习惯。研究表明这能显著提升幸福感和睡眠质量。
          </p>
        </div>

        {/* Gratitude items */}
        <div className="space-y-4">
          {items.map((item, i) => {
            const labels = ['第一件好事', '第二件好事', '第三件好事', '第四件好事', '第五件好事', '第六件好事', '第七件好事', '第八件好事']
            const placeholders = [
              '今天有什么让你觉得还不错的事？',
              '也许很小，一个微笑、一口好吃的…',
              '想想有谁或什么事让你心存感激',
              '还有什么让你微笑的瞬间…',
            ]
            return (
              <div key={i}>
                <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                  {ICONS[i % ICONS.length]} {labels[i] ?? `第${i + 1}件好事`}
                </label>
                <textarea
                  className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                  rows={2}
                  placeholder={placeholders[i] ?? placeholders[3]}
                  value={item}
                  onChange={(e) => updateItem(i, e.target.value)}
                />
              </div>
            )
          })}
        </div>

        {/* Add button */}
        {items.length < 8 && (
          <button
            onClick={addItem}
            className="flex items-center gap-2 text-body-sm text-primary hover:underline underline-offset-2"
          >
            <Plus size={16} />
            再写一件好事
          </button>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!anyFilled || saving}
          className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? '保存中…' : '记录今天的美好'}
        </button>

        {/* Link to history */}
        <Link
          href="/toolkit/gratitude/history"
          className="bg-surface rounded-card shadow-card border border-border p-4 flex items-center justify-between hover:bg-surface-2/50 transition-colors"
        >
          <div>
            <p className="text-body-md font-medium text-text-primary">过往记录</p>
            <p className="text-body-sm text-text-muted">已记录 {loading ? '…' : totalDays} 天</p>
          </div>
          <span className="text-body-sm text-primary">查看详情 →</span>
        </Link>
      </div>
    </div>
  )
}
