'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface AppHeaderProps {
  showBack?: boolean
  onBack?: () => void
  title?: string
  nickname?: string
  avatar?: string
  rightAction?: React.ReactNode
}

export function AppHeader({
  showBack,
  onBack,
  title,
  nickname = '小豆包',
  avatar,
  rightAction,
}: AppHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) onBack()
    else router.back()
  }

  return (
    <header className="h-14 backdrop-blur-sm bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10">
      {/* 左侧 */}
      <div className="flex-1">
        {showBack ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-primary -ml-1 p-1 transition-colors duration-200 hover:text-primary-dark"
          >
            <ChevronLeft size={22} />
            <span className="text-body-sm">返回</span>
          </button>
        ) : (
          <h1 className="font-serif text-primary text-title-md tracking-wide">粘豆包</h1>
        )}
      </div>

      {/* 中间 title */}
      {title && (
        <span className="text-body-md font-medium text-text-primary">{title}</span>
      )}

      {/* 右侧 */}
      <div className="flex-1 flex justify-end items-center gap-3">
        {rightAction}
        {!showBack && (
          <Link href="/settings/profile">
            <div className="w-8 h-8 rounded-full bg-surface-2 border-2 border-border flex items-center justify-center">
              <span className="text-body-sm">{avatar || (nickname.charAt(0) === '小' ? '🐰' : nickname.charAt(0))}</span>
            </div>
          </Link>
        )}
      </div>
    </header>
  )
}
