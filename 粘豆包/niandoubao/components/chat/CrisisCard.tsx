'use client'
import { Heart } from 'lucide-react'

interface CrisisCardProps {
  onDismiss?: () => void
}

export function CrisisCard({ onDismiss }: CrisisCardProps) {
  return (
    <div className="px-4 py-3 bg-background border-t border-border pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="bg-crisis-bg border border-crisis/[0.18] rounded-card p-4 animate-card-in">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={14} className="text-crisis" fill="currentColor" />
          <h3 className="font-serif text-title-sm text-crisis">我在这里陪着你</h3>
        </div>
        <p className="text-body-sm text-text-primary leading-[1.8] mb-3">
          听起来你现在很难受，感谢你愿意告诉我。这种时刻，和专业的人说说话会更有帮助。
        </p>
        <div className="space-y-2 mb-3">
          <a href="tel:4001619995" className="flex items-center justify-between bg-surface rounded-btn px-3 py-2.5 border border-crisis/[0.12] hover:shadow-card active:scale-[0.98] transition-all duration-200">
            <span className="text-body-sm text-text-primary">全国心理援助热线</span>
            <span className="text-body-sm font-medium text-crisis">400-161-9995</span>
          </a>
          <a href="tel:01082951332" className="flex items-center justify-between bg-surface rounded-btn px-3 py-2.5 border border-crisis/[0.12] hover:shadow-card active:scale-[0.98] transition-all duration-200">
            <span className="text-body-sm text-text-primary">北京心理危机中心</span>
            <span className="text-body-sm font-medium text-crisis">010-82951332</span>
          </a>
        </div>
        <p className="text-label text-text-muted mb-2">粘豆包不是心理医生，但这些人可以帮你</p>
        {onDismiss && (
          <button onClick={onDismiss} className="text-body-sm text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors duration-200">
            我没事，继续聊
          </button>
        )}
      </div>
    </div>
  )
}
