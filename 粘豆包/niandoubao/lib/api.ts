// lib/api.ts — 客户端直接调 FastAPI 后端（通过 Nginx 代理）

import { createClient } from '@/lib/supabase/client'

/** 获取 Supabase access token（会自动刷新过期 token） */
async function getToken(): Promise<string | null> {
  try {
    const supabase = createClient()
    // getSession 从本地存储读取，如果过期会自动刷新
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) {
      console.warn('[api] No session, trying refresh...')
      // 尝试刷新
      const { data: { session: refreshed } } = await supabase.auth.refreshSession()
      return refreshed?.access_token ?? null
    }
    return session.access_token
  } catch (e) {
    console.error('[api] getToken failed:', e)
    return null
  }
}

/** 带认证的 fetch（直接调后端 /api/zhandoubao/...） */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  if (!token) {
    console.error('[api] No token available, user may not be logged in')
    // 返回一个模拟 401 响应，前端会处理
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  }
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(`/api/zhandoubao${path}`, { ...options, headers })
}
