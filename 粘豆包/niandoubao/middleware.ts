import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 使用 getSession() 替代 getUser()，避免每次跳转都发网络请求验证
  // getSession() 从本地 cookie 读取，速度快得多
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // 登录页和静态页不拦截
  const p = pathname.replace(/\/$/, '') || '/'
  if (p === '/login' || p === '/privacy' || p === '/terms') {
    return supabaseResponse
  }

  // 所有其他页面都需要登录
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 首页重定向到聊天
  if (p === '/' || p === '') {
    const url = request.nextUrl.clone()
    url.pathname = '/chat'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/login', '/chat', '/settings/:path*', '/history', '/toolkit/:path*', '/onboarding', '/privacy', '/terms'],
}
