import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 bg-white/90 backdrop-blur-sm border-b border-border flex items-center px-5 sticky top-0 z-10">
        <Link href="/settings" className="text-primary p-1 -ml-1">
          <ChevronLeft size={22} />
        </Link>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">用户协议</span>
        <div className="w-6" />
      </header>

      <div className="max-w-md mx-auto px-page-x py-page-y">
        <div className="prose prose-sm text-text-primary space-y-5">
          <p className="text-body-sm text-text-muted">最后更新：2026年3月29日</p>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">1. 服务说明</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              粘豆包是一款 AI 情绪陪伴工具，旨在帮助用户进行每日情绪签到和微行动管理。<strong>本产品不是心理咨询、心理治疗或医疗服务的替代品。</strong>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">2. AI 服务声明</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              粘豆包的回复由人工智能模型生成，可能存在不准确或不恰当的内容。AI 回复仅供参考，不构成任何专业建议。我们不对 AI 生成内容的准确性、完整性或适用性做任何保证。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">3. 心理健康免责声明</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              粘豆包<strong>不提供</strong>以下服务：心理诊断、心理治疗、药物建议、危机干预。如果你正在经历严重的心理健康问题，请立即联系专业心理咨询师或拨打心理援助热线（400-161-9995）。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">4. 用户责任</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              你需要对自己的账户安全负责。请勿分享你的账户密码。你同意不利用本服务发布违法、有害或侵犯他人权益的内容。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">5. 年龄要求</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              本服务仅面向18岁及以上用户。使用本服务即表示你确认已年满18周岁。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">6. 服务变更与终止</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              我们保留随时修改、暂停或终止服务的权利。重大变更将通过应用内通知告知用户。你可以随时通过删除账户来终止使用本服务。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-title-sm text-text-primary">7. 免责条款</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              本服务按现状提供。在法律允许的最大范围内，我们不对因使用或无法使用本服务而产生的任何直接、间接、附带或后果性损害承担责任。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
