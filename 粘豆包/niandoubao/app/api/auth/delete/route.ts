import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE() {
  // 验证当前登录用户
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  // 用管理员权限删除用户（会级联删除所有关联数据）
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: '删除失败，请稍后再试' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
