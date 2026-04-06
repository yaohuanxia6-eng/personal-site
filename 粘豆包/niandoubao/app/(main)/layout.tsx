'use client'

import { BottomNav } from '@/components/layout/BottomNav'
import { ToastProvider } from '@/components/ui/toast'
import { usePathname } from 'next/navigation'

// 这些子页面不显示底部导航栏（工具详情页、引导页）
const HIDE_NAV_PATTERNS = [
  '/toolkit/breathing',
  '/toolkit/diary',
  '/toolkit/cbt',
  '/toolkit/grounding',
  '/toolkit/safety-plan',
  '/toolkit/gratitude',
  '/onboarding',
  '/settings/profile',
  '/settings/memory',
  '/settings/reminder',
]

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = HIDE_NAV_PATTERNS.some(p => pathname.startsWith(p))

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-background relative overflow-hidden">
        <div className={hideNav ? 'flex flex-col flex-1 overflow-hidden' : 'flex flex-col flex-1 overflow-hidden pb-14'}>
          {children}
        </div>
        {!hideNav && <BottomNav />}
      </div>
    </ToastProvider>
  )
}
