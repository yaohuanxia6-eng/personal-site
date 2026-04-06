import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 使用 service_role key 创建管理员客户端，可以跳过邮箱确认
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// 简易频率限制：同一 IP 每小时最多 5 次注册
const signupLimitMap = new Map<string, { count: number; resetAt: number }>()
const SIGNUP_LIMIT = 5
const SIGNUP_WINDOW = 60 * 60 * 1000 // 1 小时

function checkSignupLimit(ip: string): boolean {
  const now = Date.now()
  const entry = signupLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    signupLimitMap.set(ip, { count: 1, resetAt: now + SIGNUP_WINDOW })
    return true
  }
  if (entry.count >= SIGNUP_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  // 频率限制
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkSignupLimit(ip)) {
    return NextResponse.json({ error: '注册请求过于频繁，请稍后再试' }, { status: 429 })
  }

  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: '请填写账户名和密码' }, { status: 400 })
  }

  // 密码强度校验
  if (password.length < 6) {
    return NextResponse.json({ error: '密码至少需要6位' }, { status: 400 })
  }

  // 用管理员权限创建用户，自动确认邮箱
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    // 统一模糊错误信息，防止用户枚举
    if (error.message.includes('already been registered')) {
      return NextResponse.json(
        { error: '注册失败，该账户名可能已被使用或格式不正确' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '注册失败，请检查账户名格式（需包含@和域名）' },
      { status: 400 }
    )
  }

  return NextResponse.json({ user: data.user })
}
