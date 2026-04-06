'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { styles as s } from '@/lib/styles'
import { apiFetch } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { AVATAR_OPTIONS } from '@/types'

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('🐰')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setUserEmail(user.email)
      const res = await apiFetch('/profile')
      if (res.ok) {
        const raw = await res.json()
        const p = raw.data ?? raw
        setNickname(p.nickname ?? '')
        setAvatar(p.avatar ?? '🐰')
      }
    }
    load()
  }, [supabase.auth])

  async function handleSave() {
    setSaving(true)
    const res = await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify({ nickname, avatar }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  async function handleChangePw() {
    if (!curPw || !newPw) return
    if (newPw.length < 6) { setPwMsg('新密码至少需要6位'); return }
    setChangingPw(true); setPwMsg('')
    const res = await fetch('/projects/zhandoubao/api/auth/reset-password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    })
    const result = await res.json()
    if (res.ok) {
      setPwMsg('密码修改成功'); setCurPw(''); setNewPw('')
      setTimeout(() => { setShowPw(false); setPwMsg('') }, 2000)
    } else { setPwMsg(result.error || '修改失败') }
    setChangingPw(false)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-primary -ml-1 p-1"><ChevronLeft size={22} /></button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">个人信息</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-page-x py-page-y space-y-5 max-w-md mx-auto w-full">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-[40px] relative group"
          >
            {avatar || '🐰'}
            <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-body-sm">换头像</span>
            </div>
          </button>
          <p className="text-body-sm text-text-muted">{userEmail}</p>
        </div>

        {/* Avatar picker modal */}
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAvatarPicker(false)}>
            <div className="bg-surface rounded-card shadow-card p-5 mx-6 max-w-[340px] w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-serif text-title-sm font-semibold text-text-primary text-center mb-4">选择你的头像</h3>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { setAvatar(emoji); setShowAvatarPicker(false) }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-[24px] transition-all ${
                      avatar === emoji ? 'bg-primary/15 ring-2 ring-primary scale-110' : 'bg-surface-2 hover:bg-primary/10 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAvatarPicker(false)} className={`w-full mt-4 ${s.btnSecondary}`}>取消</button>
            </div>
          </div>
        )}

        {/* Nickname */}
        <div>
          <label className="block text-body-sm text-text-secondary mb-1.5">昵称</label>
          <input className={s.input} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="你想让我怎么称呼你？" />
        </div>

        <button onClick={handleSave} disabled={saving} className={`w-full ${s.btnPrimary} disabled:opacity-60 ${saved ? 'bg-accent shadow-none' : ''}`}>
          {saving ? '保存中…' : saved ? '已保存' : '保存修改'}
        </button>

        {/* Password */}
        <div className="pt-2 border-t border-border">
          {!showPw ? (
            <button onClick={() => setShowPw(true)} className="text-body-sm text-primary">修改密码</button>
          ) : (
            <div className="space-y-3 animate-card-in">
              <input className={s.input} type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="当前密码" />
              <input className={s.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="新密码（至少6位）" />
              {pwMsg && <p className={`text-body-sm ${pwMsg.includes('成功') ? 'text-accent-dark' : 'text-crisis'}`}>{pwMsg}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setShowPw(false); setPwMsg('') }} className={`flex-1 ${s.btnSecondary}`}>取消</button>
                <button onClick={handleChangePw} disabled={changingPw || !curPw || !newPw} className={`flex-1 ${s.btnPrimary} disabled:opacity-40`}>{changingPw ? '修改中…' : '确认修改'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
