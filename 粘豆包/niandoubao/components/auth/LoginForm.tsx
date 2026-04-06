'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ChevronRight, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api'

export function LoginForm() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError('')

    const supabase = createClient()

    if (isSignUp) {
      // 注册：调用服务端 API，用管理员权限创建已确认用户
      const res = await fetch('/projects/zhandoubao/api/auth/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || '注册失败')
        setLoading(false)
        return
      }
      // 注册成功后自动登录
      const { error: autoLoginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (autoLoginError) {
        setError('注册成功，请切换到登录页登录')
        setLoading(false)
        return
      }
    } else {
      // 登录
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(
          signInError.message.includes('Invalid login')
            ? '账户名或密码不对，再试试？'
            : `登录失败：${signInError.message}`
        )
        setLoading(false)
        return
      }
    }

    // 登录后检查 MBTI，未设置则去 onboarding
    try {
      const mbtiRes = await apiFetch('/mbti')
      if (mbtiRes.ok) {
        const mbti = await mbtiRes.json()
        const mtype = mbti.data?.mbti_type || mbti.mbti_type
        if (!mtype) {
          router.push('/onboarding')
          router.refresh()
          return
        }
      }
    } catch { /* 检查失败直接进聊天 */ }

    router.push('/chat')
    router.refresh()
  }

  return (
    <div className="w-full">
      {/* 模式切换 */}
      <div className="flex bg-[#F5EFE6] rounded-[10px] p-1 mb-6">
        <button
          type="button"
          onClick={() => { setIsSignUp(false); setError('') }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
            !isSignUp ? 'bg-white text-[#8B7355] shadow-sm' : 'text-[#B8A898]'
          }`}
        >
          <User size={14} />
          登录
        </button>
        <button
          type="button"
          onClick={() => { setIsSignUp(true); setError('') }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
            isSignUp ? 'bg-white text-[#8B7355] shadow-sm' : 'text-[#B8A898]'
          }`}
        >
          <UserPlus size={14} />
          注册
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 账户名 */}
        <div>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8A898]" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="输入账户名"
              className="w-full bg-white border border-[rgba(139,115,85,0.18)] rounded-[10px] pl-10 pr-4 py-3 text-[14px] text-[#3D2F1F] placeholder:text-[#B8A898] focus:outline-none focus:border-[#A89070] transition-colors"
            />
          </div>
          {isSignUp && (
            <p className="text-[11px] text-[#B8A898] mt-1.5 ml-1">格式：名字@任意域名，如 xiaodou@qq.com</p>
          )}
        </div>

        {/* 密码 */}
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8A898]" />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={isSignUp ? '设置密码（至少6位）' : '输入密码'}
            className="w-full bg-white border border-[rgba(139,115,85,0.18)] rounded-[10px] pl-10 pr-4 py-3 text-[14px] text-[#3D2F1F] placeholder:text-[#B8A898] focus:outline-none focus:border-[#A89070] transition-colors"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-[13px] text-[#D4634B] bg-[rgba(212,99,75,0.08)] rounded-[8px] px-3 py-2">
            {error}
          </p>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={!email || !password || loading}
          className="w-full bg-[#8B7355] text-white rounded-[10px] py-3 text-[14px] font-medium flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform shadow-[0_2px_8px_rgba(139,115,85,0.25)]"
        >
          {loading ? (
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : (
            <>
              {isSignUp ? '注册并进入' : '登录'}
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* 底部提示 */}
      <p className="text-center text-[12px] text-[#B8A898] mt-4">
        {isSignUp ? '已有账号？' : '还没有账号？'}
        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError('') }}
          className="text-[#8B7355] ml-1 underline underline-offset-2"
        >
          {isSignUp ? '去登录' : '去注册'}
        </button>
      </p>
    </div>
  )
}
