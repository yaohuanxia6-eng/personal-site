'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { EmotionType } from '@/types'
import { apiFetch } from '@/lib/api'

interface SessionSummary {
  id: string
  session_date: string
  emotion_type: EmotionType | null
  micro_action: string | null
  micro_action_done: boolean
  status: string
}

// 签到情绪选项（8种，与图例完全一致，不含"危机"）
const CHECKIN_EMOTIONS: { type: EmotionType; emoji: string; score: number }[] = [
  { type: '愉悦', emoji: '😊', score: 5 },
  { type: '平静', emoji: '🍃', score: 3.5 },
  { type: '焦虑', emoji: '😰', score: 2 },
  { type: '混乱', emoji: '🌀', score: 2.5 },
  { type: '空虚', emoji: '😶', score: 2 },
  { type: '低落', emoji: '😔', score: 1.5 },
]

// 情绪 → 颜色 / Emoji（与图例完全一致）
const EMOTION_CONFIG: Record<EmotionType, { bg: string; text: string; label: string; emoji: string; dot: string }> = {
  焦虑: { bg: 'bg-amber-400',    text: 'text-amber-700',    label: '焦虑', emoji: '😰', dot: 'bg-amber-400' },
  低落: { bg: 'bg-blue-400',     text: 'text-blue-700',     label: '低落', emoji: '😔', dot: 'bg-blue-400' },
  愉悦: { bg: 'bg-emerald-400',  text: 'text-emerald-700',  label: '愉悦', emoji: '😊', dot: 'bg-emerald-400' },
  平静: { bg: 'bg-teal-300',     text: 'text-teal-700',     label: '平静', emoji: '🍃', dot: 'bg-teal-300' },
  空虚: { bg: 'bg-gray-300',     text: 'text-gray-600',     label: '空虚', emoji: '😶', dot: 'bg-gray-300' },
  混乱: { bg: 'bg-orange-400',   text: 'text-orange-700',   label: '混乱', emoji: '🌀', dot: 'bg-orange-400' },
  危机: { bg: 'bg-red-400',      text: 'text-red-700',      label: '危机', emoji: '🆘', dot: 'bg-red-400' },
}
const EMPTY_DAY = { bg: 'bg-surface-2', text: 'text-text-muted', label: '无记录', emoji: '', dot: 'bg-surface-2' }

/** 生成近 N 天的日期数组（YYYY-MM-DD），今天在最前 */
function buildDayRange(days: number): string[] {
  const result: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86_400_000)
    result.push(d.toISOString().split('T')[0])
  }
  return result
}

/** 格式化日期 "4/1" */
function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

export default function HistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCheckin, setShowCheckin] = useState(false)
  const [checkinSaving, setCheckinSaving] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    apiFetch('/sessions/history')
      .then(r => r.json())
      .then(data => {
        const items = data.data ?? data
        setSessions(Array.isArray(items) ? items : [])
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const today = new Date().toISOString().split('T')[0]
  const sessionByDate = Object.fromEntries(sessions.map(s => [s.session_date, s]))
  const todayHasRecord = !!sessionByDate[today]?.emotion_type

  // 今日的 session（用于显示当日微行动）
  const todaySession = sessionByDate[today]

  async function handleCheckin(emotion: typeof CHECKIN_EMOTIONS[number]) {
    setCheckinSaving(true)
    try {
      await apiFetch('/emotion', {
        method: 'POST',
        body: JSON.stringify({
          emotion: emotion.type,
          score: emotion.score,
          record_date: today,
        }),
      })
      const sessionRes = await apiFetch('/sessions/today', { method: 'POST' })
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        const session = sessionData.data ?? sessionData
        if (session?.id) {
          await apiFetch(`/sessions/${session.id}/messages`, {
            method: 'PUT',
            body: JSON.stringify({
              messages: session.messages ?? [],
              emotion_type: emotion.type,
            }),
          })
        }
      }
      setShowCheckin(false)
      fetchData()
    } catch { /* silently fail */ }
    finally { setCheckinSaving(false) }
  }

  const days30 = buildDayRange(30)

  // 情绪分布统计
  const emotionCount: Partial<Record<EmotionType, number>> = {}
  for (const s of sessions) {
    if (s.emotion_type) emotionCount[s.emotion_type] = (emotionCount[s.emotion_type] ?? 0) + 1
  }
  const totalWithEmotion = Object.values(emotionCount).reduce((a, b) => a + b, 0)

  // 连续签到天数
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0]
    if (sessionByDate[d]) streak++
    else break
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y space-y-5 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-baseline gap-3 mb-0">
          <h1 className="font-serif text-[28px] font-bold text-text-primary flex-shrink-0">情绪记录</h1>
          <p className="text-body-sm text-text-muted">你已经和粘豆包相伴了 {sessions.length} 天</p>
        </div>

        {/* 今日签到按钮（已签到则不显示） */}
        {!loading && !todayHasRecord && (
          <button
            onClick={() => setShowCheckin(true)}
            className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-lg">🫘</span>
            今日签到 — 记录此刻心情
          </button>
        )}

        {/* 已签到提示 */}
        {!loading && todayHasRecord && (
          <div className="bg-accent/10 border border-accent/20 rounded-btn px-4 py-2.5 flex items-center justify-center gap-2">
            <span>{EMOTION_CONFIG[sessionByDate[today]?.emotion_type as EmotionType]?.emoji ?? '✅'}</span>
            <span className="text-body-sm text-accent-dark font-medium">
              今日已签到 · {sessionByDate[today]?.emotion_type}
            </span>
          </div>
        )}

        {/* 签到弹窗 */}
        {showCheckin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !checkinSaving && setShowCheckin(false)}>
            <div className="bg-surface rounded-card shadow-card border border-border p-6 mx-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-title-sm font-serif text-text-primary text-center mb-1">今天感觉怎么样？</h3>
              <p className="text-body-sm text-text-muted text-center mb-5">选一个最贴近此刻的心情</p>
              <div className="grid grid-cols-3 gap-3">
                {CHECKIN_EMOTIONS.map(em => {
                  const cfg = EMOTION_CONFIG[em.type]
                  return (
                    <button
                      key={em.type}
                      disabled={checkinSaving}
                      onClick={() => handleCheckin(em)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-card border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 active:scale-95 disabled:opacity-50"
                    >
                      <span className="text-2xl">{em.emoji}</span>
                      <span className="text-body-sm text-text-primary">{em.type}</span>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    </button>
                  )
                })}
              </div>
              {checkinSaving && (
                <p className="text-body-sm text-text-muted text-center mt-4">保存中...</p>
              )}
              <button
                onClick={() => setShowCheckin(false)}
                disabled={checkinSaving}
                className="mt-4 w-full text-body-sm text-text-muted hover:text-text-secondary transition-colors text-center"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-3 pt-20 text-text-muted">
            <span className="flex gap-1.5">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
            <p className="text-body-sm">加载中…</p>
          </div>
        ) : (
          <>
            {/* ── 概览数字 ── */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard value={sessions.length} label="已签到" unit="天" />
              <StatCard value={streak} label="连续签到" unit="天" />
              <StatCard
                value={todaySession?.micro_action ? (todaySession.micro_action_done ? 100 : 0) : 0}
                label="今日行动"
                unit="%"
              />
            </div>

            {/* ── 30 天情绪日历 ── */}
            <section>
              <SectionTitle>近 30 天</SectionTitle>
              <div className="bg-surface rounded-card shadow-card p-4">
                <div className="grid grid-cols-7 gap-1.5">
                  {days30.map(date => {
                    const session = sessionByDate[date]
                    const cfg = session?.emotion_type
                      ? (EMOTION_CONFIG[session.emotion_type] ?? EMPTY_DAY)
                      : EMPTY_DAY
                    const isToday = date === today
                    return (
                      <div key={date} className="flex flex-col items-center gap-0.5">
                        <div
                          title={`${fmtDate(date)} ${cfg.label}`}
                          className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center text-[11px] select-none
                            ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                        >
                          {session?.emotion_type ? cfg.emoji : (
                            <span className="text-text-muted/40 text-[10px]">·</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 图例 — 与 EMOTION_CONFIG 完全一致 */}
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
                  {(Object.entries(EMOTION_CONFIG) as [EmotionType, typeof EMOTION_CONFIG[EmotionType]][]).map(([type, cfg]) => (
                    <div key={type} className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} flex-shrink-0`} />
                      <span className="text-label text-text-muted">{cfg.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-2 flex-shrink-0 border border-border" />
                    <span className="text-label text-text-muted">未签到</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 今日微行动（在30天日历下面） ── */}
            {todaySession?.micro_action && (
              <section>
                <SectionTitle>今日微行动</SectionTitle>
                <div className="bg-surface rounded-card shadow-card p-4">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] ${
                      todaySession.micro_action_done
                        ? 'bg-accent/20 text-accent-dark'
                        : 'bg-surface-2 text-text-muted'
                    }`}>
                      {todaySession.micro_action_done ? '✓' : '·'}
                    </span>
                    <div>
                      <p className="text-body-sm text-text-primary">{todaySession.micro_action}</p>
                      <p className="text-label text-text-muted mt-0.5">
                        {todaySession.micro_action_done ? '已完成 🌱' : '进行中…'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── 情绪分布 ── */}
            {totalWithEmotion > 0 && (
              <section>
                <SectionTitle>情绪分布</SectionTitle>
                <div className="bg-surface rounded-card shadow-card p-4 space-y-3">
                  {(Object.entries(emotionCount) as [EmotionType, number][])
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const cfg = EMOTION_CONFIG[type]
                      if (!cfg) return null
                      const pct = Math.round(count / totalWithEmotion * 100)
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-body-sm text-text-primary flex items-center gap-1.5">
                              <span>{cfg.emoji}</span>{cfg.label}
                            </span>
                            <span className="text-body-sm text-text-muted">{count} 天</span>
                          </div>
                          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cfg.bg} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </section>
            )}

            {/* 空状态 */}
            {sessions.length === 0 && (
              <div className="flex flex-col items-center gap-3 pt-16 text-text-muted">
                <p className="text-title-sm font-serif text-text-secondary">还没有签到记录</p>
                <p className="text-body-sm text-center">每天和粘豆包聊聊，<br />这里会慢慢长出你的情绪地图 🗺️</p>
                <button
                  onClick={() => router.push('/chat')}
                  className="mt-2 bg-primary text-white rounded-btn px-5 py-2.5 text-body-sm font-medium shadow-btn"
                >
                  开始今天的签到
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label, unit }: { value: number; label: string; unit: string }) {
  return (
    <div className="bg-surface rounded-card shadow-card p-3 text-center">
      <p className="text-title-md font-serif text-primary">
        {value}<span className="text-body-sm text-text-muted ml-0.5">{unit}</span>
      </p>
      <p className="text-label text-text-muted mt-0.5">{label}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-label uppercase tracking-widest text-text-muted mb-2">{children}</h2>
  )
}
