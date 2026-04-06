'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

const steps = [
  { count: 5, sense: '看到', emoji: '👁️', instruction: '说出你现在能看到的 5 样东西', borderColor: '#8B7355', titleColor: '#6B5640', rows: 2 },
  { count: 4, sense: '听到', emoji: '👂', instruction: '说出你现在能听到的 4 种声音', borderColor: '#7BAE84', titleColor: '#5A9468', rows: 2 },
  { count: 3, sense: '触碰', emoji: '✋', instruction: '说出你现在能触碰到的 3 样东西', borderColor: '#FBBF24', titleColor: '#B45309', rows: 2 },
  { count: 2, sense: '闻到', emoji: '👃', instruction: '说出你现在能闻到的 2 种气味', borderColor: '#60A5FA', titleColor: '#2563EB', rows: 1 },
  { count: 1, sense: '尝到', emoji: '👅', instruction: '说出你现在能尝到的 1 种味道', borderColor: '#F472B6', titleColor: '#DB2777', rows: 1 },
]

export default function GroundingPage() {
  const router = useRouter()
  const [visibleSteps, setVisibleSteps] = useState(1)
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''))
  const [completed, setCompleted] = useState(false)

  function handleNext(stepIndex: number) {
    if (stepIndex >= steps.length - 1) {
      setCompleted(true)
    } else {
      setVisibleSteps(stepIndex + 2)
      setTimeout(() => {
        document.getElementById(`g-step-${stepIndex + 1}`)?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[430px] mx-auto">
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        <button onClick={() => router.back()} className="flex items-center text-primary -ml-1 p-1">
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">感官落地</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto px-page-x py-page-y">
        {/* 简介 */}
        <p className="text-body-sm text-text-secondary leading-relaxed mb-5">
          用五种感官把注意力拉回当下。每一步写下你感受到的事物，不需要完美。
        </p>

        {/* 步骤卡片 */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            i < visibleSteps && !completed && (
              <div
                key={i}
                id={`g-step-${i}`}
                className="bg-surface rounded-card p-4"
                style={{
                  borderLeft: `3px solid ${step.borderColor}`,
                  boxShadow: '0 1px 6px rgba(139,115,85,0.08), 0 4px 16px rgba(139,115,85,0.04)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{step.emoji}</span>
                  <h3 className="text-[15px] font-semibold" style={{ color: step.titleColor }}>
                    {step.count} 件你{step.sense}的
                  </h3>
                </div>
                <p className="text-body-sm text-text-muted mb-3">{step.instruction}</p>
                <textarea
                  className="w-full bg-surface text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '10px 13px',
                    lineHeight: '1.6',
                    fontFamily: 'inherit',
                  }}
                  rows={step.rows}
                  placeholder={`写下你${step.sense}的${step.count}样东西…`}
                  value={answers[i]}
                  onChange={(e) => {
                    const next = [...answers]
                    next[i] = e.target.value
                    setAnswers(next)
                  }}
                />
                {i >= visibleSteps - 1 && (
                  <button
                    onClick={() => handleNext(i)}
                    disabled={!answers[i].trim()}
                    className="mt-3 w-full border border-border rounded-btn py-2 text-[13px] font-medium text-text-secondary hover:border-primary-light hover:text-primary transition-all disabled:opacity-40"
                  >
                    {i >= steps.length - 1 ? '完成 ✓' : '完成，下一步 →'}
                  </button>
                )}
              </div>
            )
          ))}

          {/* 完成状态 */}
          {completed && (
            <div className="bg-surface rounded-card p-5 text-center" style={{ boxShadow: '0 1px 6px rgba(139,115,85,0.08), 0 4px 16px rgba(139,115,85,0.04)' }}>
              <span className="text-lg block mb-2">🌿</span>
              <h3 className="font-serif text-[17px] font-medium text-text-primary mb-2">你回来了</h3>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                感受一下现在的状态。<br />你的注意力已经从焦虑中回到了当下。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
