'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, UserRound, Brain, Bell, Shield, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userEmail, setUserEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('🐰')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('21:00')
  const [loggingOut, setLoggingOut] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [mbtiType, setMbtiType] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setUserEmail(user.email)
      const [profileRes, mbtiRes] = await Promise.all([
        apiFetch('/profile'),
        apiFetch('/mbti'),
      ])
      if (profileRes.ok) {
        const raw = await profileRes.json()
        const p = raw.data ?? raw
        setNickname(p.nickname ?? '')
        setAvatar(p.avatar ?? '🐰')
        setReminderEnabled(p.reminder_enabled ?? false)
        setReminderTime(p.reminder_time ?? '21:00')
      }
      if (mbtiRes.ok) {
        const raw = await mbtiRes.json()
        const m = raw.data ?? raw
        setMbtiType(m.mbti_type ?? '')
      }
      setProfileLoaded(true)
    }
    load()
  }, [supabase.auth])

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Reusable setting row
  function SettingRow({ icon, iconBg, label, detail, onClick, href }: {
    icon: React.ReactNode; iconBg: string;
    label: string; detail?: string;
    onClick?: () => void; href?: string;
  }) {
    const inner = (
      <>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className="flex-1 text-left text-body-md text-text-primary">{label}</span>
        {detail && <span className="text-body-sm text-text-muted">{detail}</span>}
        <ChevronRight size={18} className="text-text-muted flex-shrink-0" />
      </>
    )
    const cls = "w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-surface-2/50 transition-colors active:bg-surface-2"
    if (href) return <Link href={href} className={cls}>{inner}</Link>
    return <button onClick={onClick} className={cls}>{inner}</button>
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="px-page-x pt-10 pb-8 space-y-3">

        {/* Title */}
        <h1 className="font-serif text-[28px] font-bold text-text-primary mb-1">我的</h1>

        {/* Profile card — click to edit */}
        <button
          onClick={() => router.push('/settings/profile')}
          className="w-full bg-surface rounded-card shadow-card p-4 flex items-center gap-4 hover:bg-surface-2/30 transition-colors active:bg-surface-2/50"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-[28px] flex-shrink-0">
            {avatar || '🐰'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[17px] text-text-primary font-semibold truncate">
              {profileLoaded ? nickname || '小豆包' : '加载中…'}
            </p>
            <p className="text-body-sm text-text-muted truncate">{userEmail}</p>
          </div>
          <ChevronRight size={18} className="text-text-muted flex-shrink-0" />
        </button>

        {/* Main settings group */}
        <div className="bg-surface rounded-card shadow-card divide-y divide-border">
          <SettingRow
            icon={<UserRound size={17} className="text-[#7C4DFF]" strokeWidth={1.8} />}
            iconBg="bg-[#EDE7F6]"
            label="MBTI 偏好"
            detail={mbtiType || '未设置'}
            onClick={() => router.push('/onboarding')}
          />
          <SettingRow
            icon={<Brain size={17} className="text-[#2196F3]" strokeWidth={1.8} />}
            iconBg="bg-[#E3F2FD]"
            label="粘豆包的记忆"
            onClick={() => router.push('/settings/memory')}
          />
          <SettingRow
            icon={<Bell size={17} className="text-[#F57C00]" strokeWidth={1.8} />}
            iconBg="bg-[#FFF3E0]"
            label="每日提醒"
            detail={reminderEnabled ? `${reminderTime} 已开启` : '未开启'}
            onClick={() => router.push('/settings/reminder')}
          />
        </div>

        {/* Secondary group */}
        <div className="bg-surface rounded-card shadow-card divide-y divide-border">
          <SettingRow
            icon={<Shield size={17} className="text-[#9E9E9E]" strokeWidth={1.8} />}
            iconBg="bg-[#F5F5F5]"
            label="隐私与协议"
            href="/privacy"
          />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-surface-2/50 transition-colors active:bg-surface-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FFEBEE] flex items-center justify-center flex-shrink-0">
              <LogOut size={17} className="text-[#E53935]" strokeWidth={1.8} />
            </div>
            <span className="flex-1 text-left text-body-md text-[#E53935]">
              {loggingOut ? '退出中…' : '退出登录'}
            </span>
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-body-sm text-text-muted pt-4 pb-4">粘豆包 V1.0.0</p>
      </div>
    </div>
  )
}
