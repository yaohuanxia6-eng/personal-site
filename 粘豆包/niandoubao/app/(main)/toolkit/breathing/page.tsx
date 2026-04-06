'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

type Phase = 'inhale' | 'hold' | 'exhale'

const PHASES: { phase: Phase; label: string; duration: number }[] = [
  { phase: 'inhale', label: '吸气', duration: 4 },
  { phase: 'hold', label: '屏住', duration: 7 },
  { phase: 'exhale', label: '呼气', duration: 8 },
]

const TOTAL_ROUNDS = 4

export default function BreathingPage() {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [round, setRound] = useState(1)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [countdown, setCountdown] = useState(PHASES[0].duration)
  const [completed, setCompleted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentPhase = PHASES[phaseIndex]

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  useEffect(() => {
    if (!started || paused) {
      clearTimer()
      return
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setPhaseIndex((pi) => {
            const nextPi = pi + 1
            if (nextPi >= PHASES.length) {
              // End of round
              setRound((r) => {
                if (r >= TOTAL_ROUNDS) {
                  setCompleted(true)
                  setStarted(false)
                  clearTimer()
                  return r
                }
                return r + 1
              })
              setCountdown(PHASES[0].duration)
              return 0
            }
            setCountdown(PHASES[nextPi].duration)
            return nextPi
          })
          return prev
        }
        return prev - 1
      })
    }, 1000)

    return () => clearTimer()
  }, [started, paused, clearTimer])

  function handleStart() {
    setStarted(true)
    setPaused(false)
    setRound(1)
    setPhaseIndex(0)
    setCountdown(PHASES[0].duration)
    setCompleted(false)
  }

  function handleTogglePause() {
    setPaused((p) => !p)
  }

  // Circle scale based on phase
  const circleScale =
    currentPhase.phase === 'inhale'
      ? 'scale-110'
      : currentPhase.phase === 'exhale'
      ? 'scale-75'
      : 'scale-100'

  const phaseColor =
    currentPhase.phase === 'inhale'
      ? 'text-accent'
      : currentPhase.phase === 'hold'
      ? 'text-primary'
      : 'text-text-secondary'

  if (completed) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0">
          <button
            onClick={() => router.push('/toolkit')}
            className="flex items-center text-primary -ml-1 p-1"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="flex-1 text-center text-body-md font-medium text-text-primary">
            呼吸练习
          </span>
          <div className="w-6" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-serif text-title-lg text-primary mb-2">
            做得很好
          </h2>
          <p className="text-body-md text-text-secondary text-center mb-6 leading-relaxed">
            你刚刚完成了 {TOTAL_ROUNDS} 轮 4-7-8 呼吸练习。
            <br />
            希望你现在感觉好一些了。
          </p>
          <button
            onClick={() => router.push('/toolkit')}
            className="bg-primary text-white rounded-btn px-6 py-2.5 text-body-sm font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95"
          >
            返回工具箱
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center text-primary -ml-1 p-1"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">
          呼吸练习
        </span>
        <div className="w-6" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {!started ? (
          <>
            <div className="text-5xl mb-4">🫁</div>
            <h2 className="font-serif text-title-lg text-primary mb-2">
              4-7-8 呼吸法
            </h2>
            <p className="text-body-md text-text-secondary text-center mb-8 leading-relaxed">
              吸气 4 秒，屏住 7 秒，呼气 8 秒。
              <br />
              共 {TOTAL_ROUNDS} 轮，帮你快速平静下来。
            </p>
            <button
              onClick={handleStart}
              className="bg-primary text-white rounded-btn px-8 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95"
            >
              开始练习
            </button>
          </>
        ) : (
          <>
            {/* Round counter */}
            <p className="text-body-sm text-text-muted mb-6">
              第 {round} / {TOTAL_ROUNDS} 轮
            </p>

            {/* Animated circle */}
            <div
              className={`w-48 h-48 rounded-full border-4 border-primary/30 flex items-center justify-center mb-8 transition-transform duration-[1500ms] ease-in-out ${circleScale}`}
            >
              <div className="w-36 h-36 rounded-full bg-primary/[0.08] flex flex-col items-center justify-center">
                <span className={`text-4xl font-serif font-bold ${phaseColor}`}>
                  {countdown}
                </span>
                <span className={`text-body-md font-medium mt-1 ${phaseColor}`}>
                  {currentPhase.label}
                </span>
              </div>
            </div>

            {/* Phase dots */}
            <div className="flex items-center gap-3 mb-8">
              {PHASES.map((p, i) => (
                <div
                  key={p.phase}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                    i === phaseIndex ? 'bg-primary' : 'bg-primary/20'
                  }`}
                />
              ))}
            </div>

            {/* Pause / Resume */}
            <button
              onClick={handleTogglePause}
              className="bg-surface border border-border text-text-primary rounded-btn px-6 py-2.5 text-body-sm hover:bg-surface-2 transition-colors"
            >
              {paused ? '继续' : '暂停'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
