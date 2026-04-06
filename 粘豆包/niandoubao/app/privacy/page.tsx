import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 bg-white/90 backdrop-blur-sm border-b border-border flex items-center px-5 sticky top-0 z-10">
        <Link href="/settings" className="text-primary p-1 -ml-1">
          <ChevronLeft size={22} />
        </Link>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">隐私政策</span>
        <div className="w-6" />
      </header>

      <div className="max-w-md mx-auto px-page-x py-page-y">
        <div className="prose prose-sm text-text-primary space-y-5">
          <p className="text-body-sm text-text-muted">最后更新：2026年3月29日</p>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">1. 我们收集的信息</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              <strong>账户信息：</strong>注册时提供的账户名（邮箱格式）和加密存储的密码。<br />
              <strong>对话内容：</strong>你与粘豆包之间的聊天记录，用于提供情绪陪伴服务。<br />
              <strong>设置偏好：</strong>昵称、提醒时间等个性化设置。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">2. 信息如何使用</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              你的对话内容会发送至第三方 AI 服务提供商（Moonshot / Kimi）进行处理，以生成回复。我们不会将你的个人信息用于广告投放或出售给第三方。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">3. 第三方数据共享</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              <strong>AI 服务：</strong>对话内容会发送至 Moonshot (Kimi) API 用于生成 AI 回复，该服务有独立的隐私政策。<br />
              <strong>数据存储：</strong>账户和设置数据存储在 Supabase 云数据库（美国服务器）。<br />
              我们不会向上述服务之外的任何第三方共享你的数据。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">4. 数据安全</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              我们使用 HTTPS 加密传输、密码哈希存储等行业标准安全措施保护你的数据。但请注意，没有任何互联网传输方式是100%安全的。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">5. 你的权利</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              <strong>访问与导出：</strong>你可以随时在设置中查看你的账户信息。<br />
              <strong>删除账户：</strong>你可以在设置页面永久删除你的账户及所有相关数据。<br />
              <strong>撤回同意：</strong>你可以随时停止使用本服务并删除账户。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">6. 未成年人保护</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              本服务面向18岁及以上用户。如果我们发现未经监护人同意收集了未成年人的信息，将立即删除。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">7. 联系我们</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              如对隐私政策有任何疑问，请通过应用内反馈渠道联系我们。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
