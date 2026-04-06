'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { ChevronLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const PRE_FILLED_PROFESSIONAL = `全国24小时心理援助热线：400-161-9995
北京心理危机研究与干预中心：010-82951332
生命热线：400-821-1215
希望24热线：400-161-9995`

export default function SafetyPlanPage() {
  const router = useRouter()
  const toast = useToast()

  const [crisisSignals, setCrisisSignals] = useState('')
  const [selfActions, setSelfActions] = useState('')
  const [contacts, setContacts] = useState('')
  const [reasonsToLive, setReasonsToLive] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  // Load existing plan
  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/safety-plan')
        if (res.ok) {
          const data = await res.json()
          if (data && data.crisis_signals) {
            setCrisisSignals(data.crisis_signals ?? '')
            setSelfActions(data.self_actions ?? '')
            setContacts(data.contacts ?? '')
            setReasonsToLive(data.reasons_to_live ?? '')
            setSaved(true)
          }
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const anyFilled =
    crisisSignals.trim() ||
    selfActions.trim() ||
    contacts.trim() ||
    reasonsToLive.trim()

  async function handleSave() {
    if (!anyFilled) return
    setSaving(true)
    try {
      await apiFetch('/safety-plan', {
        method: 'PUT',
        body: JSON.stringify({
          crisis_signals: crisisSignals,
          self_actions: selfActions,
          contacts,
          professional_help: PRE_FILLED_PROFESSIONAL,
          reasons_to_live: reasonsToLive,
        }),
      })
      setSaved(true)
      setEditing(false)
    } catch {
      toast.show('保存失败，请稍后重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  const isReadonly = saved && !editing

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-[430px] mx-auto">
        <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0">
          <button onClick={() => router.back()} className="flex items-center text-primary -ml-1 p-1">
            <ChevronLeft size={22} />
          </button>
          <span className="flex-1 text-center text-body-md font-medium text-text-primary">安全计划</span>
          <div className="w-6" />
        </header>
        <div className="px-page-x py-page-y space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-card border border-border p-4 animate-pulse">
              <div className="h-4 bg-surface-2 rounded w-1/3 mb-3" />
              <div className="h-16 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background max-w-[430px] mx-auto">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        <button onClick={() => router.back()} className="flex items-center text-primary -ml-1 p-1">
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">安全计划</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y space-y-4">
        {/* Explanation card */}
        <div className="border border-border rounded-card p-4" style={{ background: 'linear-gradient(135deg, rgba(139,115,85,0.06), rgba(123,174,132,0.06))' }}>
          <h3 className="text-body-md font-medium text-text-primary mb-1.5">
            什么是安全计划？
          </h3>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            安全计划是你在情绪低谷时的&ldquo;应急指南&rdquo;。提前写好，在最需要的时候可以快速翻阅，提醒自己可以做什么、找谁帮忙。
          </p>
        </div>

        {/* Alert card */}
        <div className="border border-accent/20 rounded-card p-4" style={{ background: 'rgba(123,174,132,0.08)' }}>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            💚 当粘豆包在对话中感知到你可能正在经历危机时，会主动展示你的安全计划。
          </p>
        </div>

        {/* Saved confirmation */}
        {saved && !editing && (
          <div className="bg-accent/[0.08] border border-accent/20 rounded-card p-4 text-center">
            <span className="text-accent text-body-md font-medium">✓ 安全计划已保存</span>
            <p className="text-body-sm text-text-muted mt-1">你可以随时修改</p>
          </div>
        )}

        {/* Section 1 */}
        <div>
          <label className="block text-body-sm text-text-secondary mb-1.5">
            1. 我感到危机的信号是
          </label>
          <textarea
            className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
            rows={3}
            placeholder="比如：连续失眠、不想出门、反复哭泣…"
            value={crisisSignals}
            onChange={(e) => setCrisisSignals(e.target.value)}
            readOnly={isReadonly}
          />
        </div>

        {/* Section 2 */}
        <div>
          <label className="block text-body-sm text-text-secondary mb-1.5">
            2. 我可以自己做的事
          </label>
          <textarea
            className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
            rows={3}
            placeholder="比如：深呼吸、听音乐、出门散步、洗热水澡…"
            value={selfActions}
            onChange={(e) => setSelfActions(e.target.value)}
            readOnly={isReadonly}
          />
        </div>

        {/* Section 3 */}
        <div>
          <label className="block text-body-sm text-text-secondary mb-1.5">
            3. 我可以联系的人
          </label>
          <textarea
            className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
            rows={3}
            placeholder="写下1-3个你信任的人的名字和联系方式…"
            value={contacts}
            onChange={(e) => setContacts(e.target.value)}
            readOnly={isReadonly}
          />
        </div>

        {/* Section 4: Pre-filled */}
        <div>
          <label className="block text-body-sm text-text-secondary mb-1.5">
            4. 专业求助渠道
          </label>
          <div className="bg-surface-2 border border-border rounded-input px-4 py-3 text-body-sm text-text-secondary whitespace-pre-line">
            {PRE_FILLED_PROFESSIONAL}
          </div>
        </div>

        {/* Section 5 */}
        <div>
          <label className="block text-body-sm text-text-secondary mb-1.5">
            5. 让我觉得活着值得的事
          </label>
          <textarea
            className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
            rows={3}
            placeholder="哪怕很小的事也好：一杯好喝的咖啡、猫的呼噜声…"
            value={reasonsToLive}
            onChange={(e) => setReasonsToLive(e.target.value)}
            readOnly={isReadonly}
          />
        </div>

        {/* Action button */}
        {saved && !editing ? (
          <button
            onClick={() => setEditing(true)}
            className="w-full bg-surface border border-border text-text-primary rounded-btn px-4 py-3 text-body-md hover:bg-surface-2 transition-colors"
          >
            修改安全计划
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!anyFilled || saving}
            className={`w-full rounded-btn px-4 py-3 text-body-md font-medium transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none ${
              saved
                ? 'bg-accent text-white shadow-btn hover:bg-accent-dark'
                : 'bg-primary text-white shadow-btn hover:bg-primary-dark'
            }`}
          >
            {saving ? '保存中…' : saved ? '✓ 已保存' : '保存安全计划'}
          </button>
        )}

        <div className="h-6" />
      </div>
    </div>
  )
}
