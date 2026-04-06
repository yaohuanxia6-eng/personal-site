'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MBTIPreference } from '@/types'
import { apiFetch } from '@/lib/api'

const dimensions = [
  {
    key: 'EI' as const,
    dimLabel: '能量来源',
    options: [
      { value: 'E' as const, emoji: '🎉', label: '外向E', desc: '社交让我充电' },
      { value: 'I' as const, emoji: '🧘', label: '内向I', desc: '独处让我充电' },
    ],
  },
  {
    key: 'SN' as const,
    dimLabel: '信息获取',
    options: [
      { value: 'S' as const, emoji: '📋', label: '实感S', desc: '关注具体细节' },
      { value: 'N' as const, emoji: '💡', label: '直觉N', desc: '关注可能性' },
    ],
  },
  {
    key: 'TF' as const,
    dimLabel: '决策方式',
    options: [
      { value: 'T' as const, emoji: '🧠', label: '思考T', desc: '逻辑优先' },
      { value: 'F' as const, emoji: '💗', label: '情感F', desc: '感受优先' },
    ],
  },
  {
    key: 'JP' as const,
    dimLabel: '生活方式',
    options: [
      { value: 'J' as const, emoji: '📅', label: '判断J', desc: '喜欢计划' },
      { value: 'P' as const, emoji: '🎨', label: '感知P', desc: '随性灵活' },
    ],
  },
]

// MBTI 16型人格特质描述
const MBTI_PROFILES: Record<string, { title: string; traits: string; chatStyle: string }> = {
  INTJ: { title: '策略家', traits: '独立思考、远见卓识、追求效率。内心世界丰富，喜欢深度分析问题。', chatStyle: '粘豆包会用更理性、有条理的方式和你聊天，偶尔抛出深度问题激发你的思考，不会用太多感叹号打扰你的安静。' },
  INTP: { title: '逻辑学家', traits: '好奇心强、热爱探索、善于发现规律。思维跳跃，喜欢"为什么"。', chatStyle: '粘豆包会和你一起探索想法背后的逻辑，给你安静思考的空间，用简洁直接的语言交流。' },
  ENTJ: { title: '指挥官', traits: '果断自信、目标明确、天生领导者。行动力强，不喜欢拖延。', chatStyle: '粘豆包会更直接、高效地和你交流，偶尔用幽默缓解压力，鼓励你表达脆弱的一面。' },
  ENTP: { title: '辩论家', traits: '机智灵活、充满创意、喜欢挑战。脑子转得快，总能看到不同角度。', chatStyle: '粘豆包会用更活泼的方式聊天，跟你碰撞想法，偶尔抛出有趣的视角让你"啊哈"。' },
  INFJ: { title: '提倡者', traits: '富有同理心、理想主义、内心深邃。关注人与人之间的深层联结。', chatStyle: '粘豆包会用更诗意、更有温度的方式和你对话，关注你内心深处的感受，给你被理解的安全感。' },
  INFP: { title: '调停者', traits: '善良敏感、充满想象力、追求真我。重视内心感受，有自己的价值观。', chatStyle: '粘豆包会温柔地陪你探索内心世界，用感性的语言和你共鸣，不催促你，让你按自己的节奏来。' },
  ENFJ: { title: '主人公', traits: '热情真诚、感染力强、天生能共情。关心身边每个人的感受。', chatStyle: '粘豆包会更热情地回应你，分享感受、鼓励你和朋友互动，在你需要时给你充足的情感支持。' },
  ENFP: { title: '竞选者', traits: '热情洋溢、创意无限、社交达人。对新事物充满好奇和热情。', chatStyle: '粘豆包会用最活泼的方式和你聊天，分享有趣的想法，鼓励你把好心情传递出去。' },
  ISTJ: { title: '物流师', traits: '务实可靠、有责任心、重视传统。做事有条理，一步一个脚印。', chatStyle: '粘豆包会用实在、具体的方式和你交流，给你明确的小建议，尊重你的做事节奏。' },
  ISFJ: { title: '守卫者', traits: '温暖体贴、默默付出、重视和谐。是最可靠的倾听者和支持者。', chatStyle: '粘豆包会特别温柔地陪伴你，关注你照顾别人时是否也照顾了自己，给你被呵护的感觉。' },
  ESTJ: { title: '总经理', traits: '高效务实、组织力强、重视秩序。喜欢把事情安排得井井有条。', chatStyle: '粘豆包会直接、高效地交流，给你可操作的建议，同时提醒你放慢脚步关注自己。' },
  ESFJ: { title: '执政官', traits: '热心肠、人缘好、乐于助人。最在乎身边人是否开心。', chatStyle: '粘豆包会热情回应你的分享，关心你和朋友家人的关系，提醒你在照顾别人的同时也爱自己。' },
  ISTP: { title: '鉴赏家', traits: '冷静理性、动手能力强、适应力好。喜欢用实践解决问题。', chatStyle: '粘豆包会用简洁实在的方式和你聊，给你具体可做的微行动，不说空话套话。' },
  ISFP: { title: '探险家', traits: '温柔敏感、审美力强、活在当下。用自己的方式感受世界的美好。', chatStyle: '粘豆包会关注你当下的感受，用温和的方式陪你发现生活中的小美好，尊重你的独处时光。' },
  ESTP: { title: '企业家', traits: '大胆果断、享受当下、行动派。喜欢刺激和挑战，不怕犯错。', chatStyle: '粘豆包会直爽地和你聊天，用行动导向的方式鼓励你，偶尔带点幽默感让你放松。' },
  ESFP: { title: '表演者', traits: '活泼开朗、热爱生活、感染力强。走到哪里都能带来欢乐。', chatStyle: '粘豆包会用最轻松愉快的语气和你聊天，帮你在低落时重新找到生活的乐趣。' },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [prefs, setPrefs] = useState<MBTIPreference>({
    EI: null,
    SN: null,
    TF: null,
    JP: null,
  })
  const [saving, setSaving] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [savedType, setSavedType] = useState('')

  useEffect(() => {
    async function loadExisting() {
      try {
        const res = await apiFetch('/mbti')
        if (res.ok) {
          const data = await res.json()
          const d = data.data ?? data
          if (d?.ei) {
            setPrefs({ EI: d.ei, SN: d.sn, TF: d.tf, JP: d.jp })
            setIsEdit(true)
          }
        }
      } catch { /* first time */ }
    }
    loadExisting()
  }, [])

  const allSelected = prefs.EI && prefs.SN && prefs.TF && prefs.JP
  const mbtiType = allSelected ? `${prefs.EI}${prefs.SN}${prefs.TF}${prefs.JP}` : ''

  function select(dim: keyof MBTIPreference, value: string) {
    setPrefs((prev) => ({ ...prev, [dim]: value }))
    setShowResult(false) // 重选时隐藏结果
  }

  async function handleSubmit() {
    if (!allSelected) return
    setSaving(true)
    try {
      await apiFetch('/mbti', {
        method: 'PUT',
        body: JSON.stringify({
          ei: prefs.EI,
          sn: prefs.SN,
          tf: prefs.TF,
          jp: prefs.JP,
        }),
      })
      setSavedType(mbtiType)
      setShowResult(true)
    } catch {
      // 保存失败也显示结果
      setSavedType(mbtiType)
      setShowResult(true)
    } finally {
      setSaving(false)
    }
  }

  function handleContinue() {
    if (isEdit) {
      router.back()
    } else {
      router.push('/chat')
    }
  }

  function handleSkip() {
    router.push('/chat')
  }

  const profile = MBTI_PROFILES[savedType]

  // 显示人格结果卡片
  if (showResult && profile) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm space-y-5 animate-card-in">
          {/* MBTI Type */}
          <div className="text-center">
            <h1 className="font-serif text-[40px] text-primary font-bold tracking-wider">{savedType}</h1>
            <p className="text-title-sm text-text-primary font-medium mt-1">{profile.title}</p>
          </div>

          {/* Traits card */}
          <div className="bg-surface rounded-card shadow-card border border-border p-5">
            <h3 className="text-body-md font-medium text-text-primary mb-2 flex items-center gap-2">
              <span>🧬</span>你的人格特质
            </h3>
            <p className="text-body-sm text-text-secondary leading-relaxed">{profile.traits}</p>
          </div>

          {/* Chat style card */}
          <div className="border border-primary/20 rounded-card p-5" style={{ background: 'linear-gradient(135deg, rgba(123,174,132,0.08), rgba(139,115,85,0.06))' }}>
            <h3 className="text-body-md font-medium text-text-primary mb-2 flex items-center gap-2">
              <span>🫘</span>粘豆包会这样陪你
            </h3>
            <p className="text-body-sm text-text-secondary leading-relaxed">{profile.chatStyle}</p>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95"
          >
            {isEdit ? '返回设置' : '开始聊天'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background items-center justify-center px-5 py-8">
      {/* Logo */}
      <h1 className="font-serif text-title-lg text-primary mb-1">粘豆包</h1>
      <p className="text-body-sm text-text-muted mb-6">
        了解你的性格偏好，让我更懂你
      </p>

      {/* MBTI Dimensions */}
      <div className="w-full max-w-sm space-y-4 mb-6">
        {dimensions.map((dim) => (
          <div key={dim.key}>
            <p className="text-body-sm text-text-muted mb-2 font-medium">{dim.dimLabel}</p>
            <div className="flex gap-3">
            {dim.options.map((opt) => {
              const isSelected = prefs[dim.key] === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => select(dim.key, opt.value)}
                  className={`flex-1 rounded-card border-2 p-3 text-left transition-all duration-200 active:scale-[0.97] ${
                    isSelected
                      ? 'border-primary bg-primary/[0.06] shadow-card'
                      : 'border-border bg-surface hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{opt.emoji}</span>
                    <span
                      className={`text-body-md font-medium ${
                        isSelected ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-body-sm text-text-secondary">{opt.desc}</p>
                </button>
              )
            })}
            </div>
          </div>
        ))}
      </div>

      {/* Preview MBTI type */}
      {allSelected && (
        <p className="text-body-sm text-text-muted mb-3">
          你的类型：<span className="text-primary font-medium">{mbtiType}</span>
        </p>
      )}

      {/* Actions */}
      <div className="w-full max-w-sm">
        <button
          onClick={handleSubmit}
          disabled={!allSelected || saving}
          className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none mb-3"
        >
          {saving ? '保存中…' : isEdit ? '保存修改' : '查看我的人格'}
        </button>
        {!isEdit && (
          <button
            onClick={handleSkip}
            className="w-full text-body-sm text-text-muted hover:text-primary transition-colors text-center"
          >
            跳过，直接开始
          </button>
        )}
        {isEdit && (
          <button
            onClick={() => router.back()}
            className="w-full text-body-sm text-text-muted hover:text-primary transition-colors text-center"
          >
            取消
          </button>
        )}
      </div>
    </div>
  )
}
