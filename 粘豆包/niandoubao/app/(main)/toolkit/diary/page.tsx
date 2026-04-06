'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const moods = [
  { emoji: '😰', label: '焦虑' },
  { emoji: '😔', label: '低落' },
  { emoji: '😊', label: '愉悦' },
  { emoji: '🍃', label: '平静' },
  { emoji: '😶', label: '空虚' },
  { emoji: '🌀', label: '混乱' },
]

const prompts = [
  { key: 'what_happened', label: '发生了什么？', placeholder: '简单描述一下触发你情绪的事件…' },
  { key: 'body_reaction', label: '身体有什么反应？', placeholder: '比如心跳加速、肩膀紧绷、胃不舒服…' },
  { key: 'thoughts', label: '脑海里在想什么？', placeholder: '浮现了哪些想法或画面…' },
  { key: 'self_talk', label: '想对自己说什么？', placeholder: '如果是好朋友遇到这件事，你会怎么说…' },
]

export default function DiaryPage() {
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState<'guided' | 'free'>('guided')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedMoodLabel, setSelectedMoodLabel] = useState<string | null>(null)
  const [guided, setGuided] = useState<Record<string, string>>({})
  const [freeText, setFreeText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasContent =
    tab === 'guided'
      ? Object.values(guided).some((v) => v.trim())
      : freeText.trim().length > 0

  const canSave = selectedMood && hasContent

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await apiFetch('/diary', {
        method: 'POST',
        body: JSON.stringify({
          mood: selectedMoodLabel,
          mood_emoji: selectedMood,
          mode: tab,
          ...(tab === 'guided'
            ? {
                event: guided.what_happened || '',
                body_reaction: guided.body_reaction || '',
                thought: guided.thoughts || '',
                self_talk: guided.self_talk || '',
              }
            : { free_text: freeText }),
        }),
      })
      setSaved(true)
    } catch {
      toast.show('保存失败，请稍后重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    const now = new Date()
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0">
          <button onClick={() => router.push('/toolkit')} className="flex items-center text-primary -ml-1 p-1">
            <ChevronLeft size={22} />
          </button>
          <span className="flex-1 text-center text-body-md font-medium text-text-primary">情绪日记</span>
          <div className="w-6" />
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y flex flex-col items-center">
          <div className="bg-surface rounded-card shadow-card border border-border p-6 text-center w-full">
            <span className="text-4xl block mb-3">{selectedMood}</span>
            <p className="text-body-md text-text-primary font-medium mb-1">{dateStr}</p>
            <p className="text-body-sm text-text-secondary">
              今天的心情：{selectedMoodLabel}
            </p>
            <p className="text-body-sm text-text-muted mt-3">日记已保存</p>
          </div>

          <Link
            href="/toolkit/diary/history"
            className="mt-6 text-body-sm text-primary hover:underline underline-offset-2"
          >
            过往日记 · 查看详情 →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center text-primary -ml-1 p-1">
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">情绪日记</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y space-y-5">
        {/* Tabs */}
        <div className="flex bg-surface-2 rounded-btn p-1 gap-1">
          {(['guided', 'free'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-btn text-body-sm font-medium transition-all duration-200 ${
                tab === t
                  ? 'bg-surface shadow-card text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t === 'guided' ? '引导模式' : '自由书写'}
            </button>
          ))}
        </div>

        {/* Mood picker */}
        <div>
          <p className="text-body-sm text-text-secondary mb-3">现在的心情是？</p>
          <div className="grid grid-cols-3 gap-2">
            {moods.map((m) => (
              <button
                key={m.label}
                onClick={() => {
                  setSelectedMood(m.emoji)
                  setSelectedMoodLabel(m.label)
                }}
                className={`flex items-center gap-2 rounded-card border-2 px-3 py-2.5 transition-all duration-200 active:scale-[0.97] ${
                  selectedMood === m.emoji
                    ? 'border-primary bg-primary/[0.06]'
                    : 'border-border bg-surface hover:border-primary/30'
                }`}
              >
                <span className="text-lg">{m.emoji}</span>
                <span className="text-body-sm text-text-primary">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {tab === 'guided' ? (
          <div className="space-y-4">
            {prompts.map((p) => (
              <div key={p.key}>
                <label className="block text-body-sm text-text-secondary mb-1.5">
                  {p.label}
                </label>
                <textarea
                  className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                  rows={3}
                  placeholder={p.placeholder}
                  value={guided[p.key] || ''}
                  onChange={(e) =>
                    setGuided((prev) => ({ ...prev, [p.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <label className="block text-body-sm text-text-secondary mb-1.5">
              写下你的感受
            </label>
            <textarea
              className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
              rows={10}
              placeholder="想写什么都可以，这里只有你自己…"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
            />
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? '保存中…' : '保存这篇日记'}
        </button>

        {/* Link to history */}
        <div className="text-center pb-4">
          <Link
            href="/toolkit/diary/history"
            className="text-body-sm text-primary hover:underline underline-offset-2"
          >
            过往日记 · 查看详情 →
          </Link>
        </div>
      </div>
    </div>
  )
}
