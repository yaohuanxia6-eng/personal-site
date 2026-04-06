'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export default function CBTPage() {
  const router = useRouter()

  const [thought, setThought] = useState('')
  const [distress, setDistress] = useState(5)
  const [evidenceFor, setEvidenceFor] = useState('')
  const [evidenceAgainst, setEvidenceAgainst] = useState('')
  const [friendAdvice, setFriendAdvice] = useState('')
  const [reframe, setReframe] = useState('')
  const [generating, setGenerating] = useState(false)
  const [insight, setInsight] = useState<{
    before: number
    after: number
    observation: string
    newCognition: string
  } | null>(null)

  const canGenerate =
    thought.trim() && evidenceAgainst.trim() && reframe.trim()

  async function handleGenerate() {
    if (!canGenerate) return
    setGenerating(true)

    try {
      // 调用后端 AI 分析端点
      const res = await apiFetch('/cbt/analyze', {
        method: 'POST',
        body: JSON.stringify({
          thought,
          score_before: distress,
          evidence: evidenceFor,
          counter_evidence: evidenceAgainst,
          friend_advice: friendAdvice,
          reframe,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        const data = result.data ?? result
        setInsight({
          before: distress,
          after: data.score_after ?? Math.max(1, distress - 2),
          observation: data.observation ?? '分析生成中遇到问题，但你完成认知重构这个过程本身就很有价值。',
          newCognition: reframe,
        })
      } else {
        // API 失败时使用基础分析
        setInsight({
          before: distress,
          after: Math.max(1, distress - 2),
          observation: `能感受到这件事给你带来了 ${distress}/10 的难受。但你已经迈出了重要的一步——正视这个想法并找到了反面证据"${evidenceAgainst.slice(0, 40)}"。你重新得出的看法更平衡、更贴近现实，这本身就是一种力量。`,
          newCognition: reframe,
        })
      }
    } catch {
      setInsight({
        before: distress,
        after: Math.max(1, distress - 2),
        observation: `能感受到这件事给你带来了 ${distress}/10 的难受。但你已经迈出了重要的一步——正视这个想法并找到了反面证据。你重新得出的看法更平衡、更贴近现实，这本身就是一种力量。`,
        newCognition: reframe,
      })
    } finally {
      setGenerating(false)
    }
  }

  function handleReset() {
    setThought('')
    setDistress(5)
    setEvidenceFor('')
    setEvidenceAgainst('')
    setFriendAdvice('')
    setReframe('')
    setInsight(null)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-primary -ml-1 p-1"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">
          认知重构
        </span>
        {insight ? (
          <button
            onClick={handleReset}
            className="text-body-sm text-primary hover:underline underline-offset-2"
          >
            重新开始
          </button>
        ) : (
          <div className="w-14" />
        )}
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y">
        {!insight ? (
          <div className="space-y-5">
            {/* Intro */}
            <p className="text-body-md text-text-secondary leading-relaxed">
              认知重构帮你发现思维中的&ldquo;自动化偏差&rdquo;，用更平衡的方式看待问题。
            </p>

            {/* Step 1: Thought */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                1. 让你难受的想法是什么？
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="写下让你反复想、很难受的那个想法…"
                value={thought}
                onChange={(e) => setThought(e.target.value)}
              />
            </div>

            {/* Step 2: Distress slider */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                2. 难受程度（1-10）
              </label>
              <div className="flex items-center gap-3">
                <span className="text-body-sm text-text-muted">一点点</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={distress}
                  onChange={(e) => setDistress(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-body-sm text-text-muted">非常</span>
                <span className="text-body-md text-primary font-medium w-10 text-center">
                  {distress}/10
                </span>
              </div>
            </div>

            {/* Step 3: Evidence for */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                3. 有什么证据支持这个想法？
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="列出支持这个想法的事实或证据…"
                value={evidenceFor}
                onChange={(e) => setEvidenceFor(e.target.value)}
              />
            </div>

            {/* Step 4: Evidence against */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                4. 有没有相反的证据？
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="有没有一些事实不支持这个想法…"
                value={evidenceAgainst}
                onChange={(e) => setEvidenceAgainst(e.target.value)}
              />
            </div>

            {/* Step 5: Friend advice */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                5. 好朋友有这个想法，你会怎么说？
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="想象好朋友跟你说了同样的话…"
                value={friendAdvice}
                onChange={(e) => setFriendAdvice(e.target.value)}
              />
            </div>

            {/* Step 6: Reframe */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                6. 重新看待这件事
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="综合以上，你能怎样更平衡地看待这件事…"
                value={reframe}
                onChange={(e) => setReframe(e.target.value)}
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              {generating ? '生成中…' : '生成认知分析'}
            </button>
          </div>
        ) : (
          /* Insight card */
          <div className="space-y-5">
            {/* Score card */}
            <div className="bg-surface rounded-card shadow-card border border-border p-5 text-center">
              <p className="text-body-sm text-text-muted mb-3">难受程度变化</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <span className="text-title-lg text-crisis font-serif">
                    {insight.before}
                  </span>
                  <p className="text-label text-text-muted mt-1">之前</p>
                </div>
                <span className="text-title-md text-text-muted">→</span>
                <div>
                  <span className="text-title-lg text-accent font-serif">
                    {insight.after}
                  </span>
                  <p className="text-label text-text-muted mt-1">之后</p>
                </div>
              </div>
            </div>

            {/* Observation */}
            <div className="border border-border rounded-card p-4" style={{ background: 'linear-gradient(135deg, rgba(123,174,132,0.08), rgba(139,115,85,0.06))' }}>
              <h3 className="text-body-md font-medium text-text-primary mb-2">
                粘豆包的观察
              </h3>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                {insight.observation}
              </p>
            </div>

            {/* New cognition */}
            <div className="bg-surface rounded-card shadow-card border border-border p-4">
              <h3 className="text-body-md font-medium text-text-primary mb-2">
                你的新认知
              </h3>
              <p className="text-body-md text-primary leading-relaxed font-medium">
                &ldquo;{insight.newCognition}&rdquo;
              </p>
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full bg-surface border border-border text-text-primary rounded-btn px-4 py-3 text-body-md hover:bg-surface-2 transition-colors"
            >
              重新开始
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
