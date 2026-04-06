'use client'

import Link from 'next/link'
import { Wind, BookHeart, Scissors, ScanEye, CircleAlert, HeartHandshake } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'

const tools = [
  {
    icon: Wind,
    iconBg: 'bg-[#E8F5E9]',
    iconColor: 'text-[#4CAF50]',
    title: '4-7-8 呼吸',
    desc: '快速平复焦虑情绪',
    tag: 'TE 推荐',
    href: '/toolkit/breathing',
  },
  {
    icon: BookHeart,
    iconBg: 'bg-[#FCE4EC]',
    iconColor: 'text-[#E91E63]',
    title: '情绪日记',
    desc: '结构化表达内心感受',
    tag: 'FI 推荐',
    href: '/toolkit/diary',
  },
  {
    icon: Scissors,
    iconBg: 'bg-[#EDE7F6]',
    iconColor: 'text-[#7C4DFF]',
    title: '认知重构',
    desc: '打破负面思维循环',
    tag: 'TI 推荐',
    href: '/toolkit/cbt',
  },
  {
    icon: ScanEye,
    iconBg: 'bg-[#FFF3E0]',
    iconColor: 'text-[#F57C00]',
    title: '五感扎根',
    desc: '将注意力拉回当下',
    tag: '通用',
    href: '/toolkit/grounding',
  },
  {
    icon: CircleAlert,
    iconBg: 'bg-[#FFEBEE]',
    iconColor: 'text-[#E53935]',
    title: '安全计划',
    desc: '应对极端情绪危机',
    tag: '危机专用',
    href: '/toolkit/safety-plan',
  },
  {
    icon: HeartHandshake,
    iconBg: 'bg-[#E0F2F1]',
    iconColor: 'text-[#26A69A]',
    title: '感恩记录',
    desc: '发现生活中的微小光亮',
    tag: 'FE 推荐',
    href: '/toolkit/gratitude',
  },
]

export default function ToolkitPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-[430px] mx-auto px-page-x py-page-y">
        {/* Header */}
        <div className="flex items-baseline gap-3 mb-3">
          <h1 className="font-serif text-[28px] font-bold text-text-primary flex-shrink-0">心理工具箱</h1>
          <p className="text-body-sm text-text-muted">选择一个适合现在的练习</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-surface rounded-card border border-border shadow-card p-4 flex flex-col gap-3 hover:shadow-card-hover transition-all duration-200 active:scale-[0.97]"
              >
                <div className={`w-11 h-11 rounded-xl ${tool.iconBg} flex items-center justify-center`}>
                  <Icon size={22} className={tool.iconColor} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-body-md font-semibold text-text-primary">
                    {tool.title}
                  </h3>
                  <p className="text-body-sm text-text-muted mt-1">{tool.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
