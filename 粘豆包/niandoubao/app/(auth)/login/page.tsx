import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {

  return (
    <div className="min-h-screen bg-[#FBF7F0] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo区 */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#8B7355] rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_16px_rgba(139,115,85,0.25)]">
            <span className="text-white text-2xl font-serif">豆</span>
          </div>
          <h1 className="font-serif text-[28px] text-[#8B7355] font-semibold mb-2">粘豆包</h1>
          <p className="text-[14px] text-[#7A6350] leading-relaxed">
            每天3分钟，记住你的故事<br />陪你找到今天能做的一件小事
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_24px_rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.08)]">
          <LoginForm />
        </div>

        {/* 底部说明 */}
        <p className="text-center text-[11px] text-[#B8A898] mt-6 leading-relaxed px-4">
          登录即表示同意<a href="/terms" className="underline underline-offset-2">用户协议</a>和<a href="/privacy" className="underline underline-offset-2">隐私政策</a><br />
          粘豆包是情绪支持工具，不提供心理诊断
        </p>
      </div>
    </div>
  )
}
