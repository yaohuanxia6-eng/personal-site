import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// 已登录用户修改密码
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: '请填写当前密码和新密码' }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: '新密码至少需要6位' }, { status: 400 })
  }

  // 先验证当前密码是否正确
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (verifyError) {
    return NextResponse.json({ error: '当前密码不正确' }, { status: 400 })
  }

  // 用管理员权限修改密码
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (error) {
    return NextResponse.json({ error: '修改失败，请稍后再试' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
