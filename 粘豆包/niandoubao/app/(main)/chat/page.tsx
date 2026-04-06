'use client'
import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { MicroActionCard } from '@/components/chat/MicroActionCard'
import { CrisisCard } from '@/components/chat/CrisisCard'
import { Message, MemoryFact } from '@/types'
import { apiFetch } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

/** 按日期给消息列表分组 */
function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: { date: string; messages: Message[] }[] = []
  let currentDate = ''

  for (const msg of messages) {
    const ts = msg.timestamp ? new Date(msg.timestamp) : new Date()
    const dateStr = `${ts.getMonth() + 1}月${ts.getDate()}日`
    if (dateStr !== currentDate) {
      currentDate = dateStr
      groups.push({ date: dateStr, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  }
  return groups
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages]               = useState<Message[]>([])
  const [nickname, setNickname]               = useState('小豆包')
  const [avatar, setAvatar]                   = useState('🐰')
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming]          = useState(false)
  const [showCrisis, setShowCrisis]           = useState(false)
  const [microAction, setMicroAction]         = useState<string | null>(null)
  const [microActionSource, setMicroActionSource] = useState<string>('')
  const [actionDone, setActionDone]           = useState(false)
  const [isLoading, setIsLoading]             = useState(true)

  // 持久化上下文
  const sessionIdRef      = useRef<string | null>(null)
  const memoryRef         = useRef<MemoryFact[]>([])
  const yesterdayActionRef = useRef<string | null>(null)
  const mbtiTypeRef       = useRef<string>('')
  const abortRef          = useRef<AbortController | null>(null)
  const bottomRef         = useRef<HTMLDivElement>(null)

  const lastActiveRef = useRef<number>(Date.now())

  // ── 从设置页/后台返回时刷新头像 + 回归问候 ───────────────────
  useEffect(() => {
    async function refreshProfile() {
      const res = await apiFetch('/profile')
      if (res.ok) {
        const profile = await res.json()
        const d = profile.data ?? profile
        if (d.nickname) setNickname(d.nickname)
        if (d.avatar) setAvatar(d.avatar)
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        lastActiveRef.current = Date.now()
      }
      if (document.visibilityState === 'visible') {
        refreshProfile()
        // 离开超过 3 分钟，AI 主动打招呼
        const awayMinutes = (Date.now() - lastActiveRef.current) / 60000
        if (awayMinutes >= 3 && !isLoading) {
          const greetings = [
            '嘿，你回来啦 ☺️ 刚才去做什么了？',
            '又见面了！刚才有没有遇到什么有趣的事？',
            '欢迎回来 🌸 我一直在这里等你呢',
            '回来啦～有什么新鲜事想和我聊聊吗？',
            '嗨！好久不见（才几分钟而已哈哈）想我了吗？',
            '你回来了！刚才的时间过得还好吗？',
            '哟，回来啦 💫 带着什么心情回来的？',
            '嘿嘿，你一离开我就有点无聊了 ☺️ 聊点什么吧',
            '回来了呀～我刚在想你会不会来找我聊天呢',
            '哈喽！外面的世界精彩吗？和我说说呗 🌈',
            '你回来的时间刚刚好，我正想找人聊天呢 ☺️',
            '欢迎回来！深呼吸一下，准备好了就开聊吧 🍃',
          ]
          const idx = Math.floor(Math.random() * greetings.length)
          const welcomeMsg = {
            role: 'ai' as const,
            content: greetings[idx],
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, welcomeMsg])
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [isLoading])

  // ── 初始化：加载今日会话 + 记忆 + 昨日行动 ───────────────────
  useEffect(() => {
    async function init() {
      try {
        const [sessionRes, memRes, ydRes] = await Promise.all([
          apiFetch('/sessions/today', { method: 'POST' }),
          apiFetch('/memory'),
          apiFetch('/sessions/yesterday'),
        ])

        // 检查 MBTI 是否已设置（失败不影响聊天）
        try {
          const mbtiRes2 = await apiFetch('/mbti')
          if (mbtiRes2.ok) {
            const mbti = await mbtiRes2.json()
            const mtype = mbti.data?.mbti_type || mbti.mbti_type
            if (!mtype) {
              router.replace('/onboarding')
              return
            }
            mbtiTypeRef.current = mtype
          }
        } catch {
          console.warn('[chat] MBTI check failed, continuing without it')
        }

        // 用户资料（昵称）
        const profileRes = await apiFetch('/profile')
        if (profileRes.ok) {
          const profile = await profileRes.json()
          const d = profile.data ?? profile
          if (d.nickname) setNickname(d.nickname)
          if (d.avatar) setAvatar(d.avatar)
        }

        // 记忆
        if (memRes.ok) {
          const mem = await memRes.json()
          memoryRef.current = mem.data?.key_facts ?? []
        }

        // 昨日微行动
        if (ydRes.ok) {
          const yd = await ydRes.json()
          if (yd.data?.micro_action) yesterdayActionRef.current = yd.data.micro_action
        }

        // 今日会话
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          const session = sessionData.data ?? sessionData
          sessionIdRef.current = session.id

          const history: Message[] = session.messages ?? []
          if (history.length > 0) {
            setMessages(history)
            if (session.micro_action) {
              setMicroAction(session.micro_action)
              setActionDone(session.micro_action_done ?? false)
              // 找到包含微行动的 AI 消息
              const source = history.find(
                (m: Message) => m.role === 'ai' && m.content.includes(session.micro_action!)
              )
              if (source) setMicroActionSource(source.content)
            }
          } else {
            // 今天第一次打开 — 获取天气并生成诗意问候
            const weather = await fetchWeather()
            const greeting = buildGreeting(yesterdayActionRef.current, weather, mbtiTypeRef.current)
            const greetingMsg: Message = {
              role: 'ai',
              content: greeting,
              timestamp: new Date().toISOString(),
            }
            setMessages([greetingMsg])
            if (sessionIdRef.current) {
              apiFetch(`/sessions/${sessionIdRef.current}/complete/`, {
                method: 'PUT',
                body: JSON.stringify({ messages: [greetingMsg] }),
              }).catch(() => {})
            }
          }
        }
      } catch (e) {
        console.error('[chat] init error:', e)
        setMessages([{
          role: 'ai',
          content: '嗨，今天怎么样？有什么想聊聊的吗',
          timestamp: new Date().toISOString(),
        }])
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  /** 获取天气 */
  async function fetchWeather(): Promise<string> {
    try {
      const res = await fetch('/projects/zhandoubao/api/weather/')
      if (!res.ok) return ''
      const data = await res.json()
      return data.desc || ''
    } catch { return '' }
  }

  function getTimeSlot(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'morning'
    if (h >= 12 && h < 17) return 'afternoon'
    if (h >= 17 && h < 22) return 'evening'
    return 'night'
  }

  /** 根据天气+时间+MBTI+昨日行动生成个性化诗意问候 */
  function buildGreeting(yesterdayAction: string | null, weather?: string, mbtiType?: string): string {
    const time = getTimeSlot()
    const w = (weather || '').toLowerCase()
    const isRain = /雨|rain|shower|drizzle/.test(w)
    const isSnow = /雪|snow/.test(w)
    const isClear = /晴|clear|sunny/.test(w)

    let weatherKey = 'cloudy'
    if (isRain) weatherKey = 'rain'
    else if (isSnow) weatherKey = 'snow'
    else if (isClear) weatherKey = 'clear'

    const today = new Date()
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()

    const mbti = (mbtiType || '').toUpperCase()
    const isF = mbti.includes('F')
    const isT = mbti.includes('T')
    const isE = mbti.includes('E')
    const isI = mbti.includes('I')
    const isN = mbti.includes('N')

    if (yesterdayAction) {
      const followUps = [
        `昨天说的「${yesterdayAction}」，后来怎么样了？不管结果如何，你愿意去试这件事本身，就已经很了不起了。`,
        `还记得昨天的小约定吗——「${yesterdayAction}」。做了吗？没做也完全没关系，今天又是新的开始。`,
        `昨天你说想试试「${yesterdayAction}」。如果做了，我想听听感受；如果没做，也可以聊聊是什么拦住了你。`,
      ]
      return followUps[daySeed % followUps.length]
    }

    const greetings: Record<string, string[]> = {
      morning_clear: [
        '晨光轻轻敲了敲窗，新的一天又温柔地来了。你有没有那种"醒来觉得还不错"的感觉？',
        '阳光铺满了窗台，像谁给你写了一封不署名的情书。今天，想从哪里开始？',
        '早安。今天的光线很好，适合把心里积攒的话都倒出来晒一晒。',
        '清晨的空气里有一种干净的甜味。如果给今天起个名字，你会叫它什么？',
        '太阳比你先醒了，但它等着你，像老朋友等你出门散步一样。',
        '阳光从窗帘缝隙挤进来，像在催你起来拥抱这一天。准备好了吗？',
      ],
      morning_rain: [
        '窗外在下雨，世界变得很安静。这种天气特别适合说点真心话。',
        '雨声像一首没有歌词的歌，把所有嘈杂都洗干净了。今天心情怎么样？',
        '下雨天有一种奇妙的许可——允许你慢一点，允许你不那么坚强。想聊聊吗？',
        '雨打在叶子上的声音，像有人在轻轻地敲门。我在这里，你想说什么都可以。',
      ],
      morning_cloudy: [
        '天空铺了一层柔柔的云，像替你盖了条薄毯。慢慢来，不着急。',
        '多云的早晨有种"可以偷偷赖床五分钟"的温柔。今天有什么计划吗？',
        '灰色的天空其实也有层次，就像心情不一定非要分好坏。现在感觉怎么样？',
        '云层很厚，阳光躲在后面偷偷看你。今天想聊点什么？',
      ],
      morning_snow: [
        '推开窗，世界被白雪轻轻包裹住了，安静得像一个秘密。这样的日子想和你说说话。',
        '雪花在窗外跳着慢动作的舞，一切都变柔软了。你还好吗？',
      ],
      afternoon_clear: [
        '午后的阳光懒洋洋地洒进来，像一只暖暖的猫趴在你身边。忙了一上午，现在怎么样？',
        '下午的光线最温柔，把影子拉得长长的。想停下来歇一会儿吗？',
        '午后总有一种恍惚感，好像时间走得特别慢。这个间隙里，有什么想说的吗？',
      ],
      afternoon_rain: [
        '下午的雨让一切都慢了下来，像世界在提醒你：不用那么着急。',
        '雨还在下，窗户上的水珠在画画。这样的下午，特别适合和自己待一会儿。',
        '下午茶时间，窗外在下雨。你给自己泡了杯什么吗？',
      ],
      afternoon_cloudy: [
        '午后的天空灰灰柔柔的，像一幅还没画完的水墨画。你这个下午过得怎样？',
        '云层压得低低的，但空气很安静。有什么一直想说但没机会说的话吗？',
      ],
      evening_clear: [
        '傍晚的天空染上了橘色和粉色，像谁打翻了一盒暖色颜料。一天快结束了，你还好吗？',
        '日落把云烧成了金色，好像一天里最温柔的句号。今天有什么值得记住的事吗？',
        '黄昏的光线总是让人想倾诉。回头看看今天，有没有什么小小的瞬间让你心动？',
      ],
      evening_rain: [
        '雨还在下，夜色一点点浓起来了。这样的傍晚，特别想听你说说话。',
        '傍晚的雨声格外分明，像在替你数今天发生的每一件事。想聊聊吗？',
      ],
      evening_cloudy: [
        '天色暗下来了，一天又快过完了。不管今天顺不顺利，你能走到这里就很好。',
        '暮色渐沉，你辛苦了一整天。想对自己说点什么吗？',
      ],
      night_clear: [
        '夜空很清，星星在很远的地方亮着，就像有人在远处替你留着一盏灯。',
        '深夜的安静是只属于你的。白天来不及说的话，现在都可以慢慢说。',
        '月亮挂在窗外，好像在安静地听。你今天还好吗？',
        '夜色像一条温柔的毯子裹住了整座城市。在这安静里，你想聊点什么？',
      ],
      night_rain: [
        '深夜的雨声像温柔的催眠曲，一切都慢了下来。有什么在你心里转了一整天？',
        '雨夜总让人格外诚实。不用掩饰，你现在真实的感受是什么？',
      ],
      night_cloudy: [
        '夜深了，云层后面藏着月亮，它没走，只是在悄悄陪你。',
        '夜晚的云很低，像整个天空都弯下腰来听你说话。今天怎么样？',
      ],
      night_snow: [
        '窗外飘着雪，深夜的世界白茫茫一片，安静得只听见自己的呼吸。',
      ],
    }

    const key = `${time}_${weatherKey}`
    const candidates = greetings[key] || greetings[`${time}_cloudy`] || ['嗨，今天过得怎么样？']
    let greeting = candidates[daySeed % candidates.length]

    if (isF && isI) {
      const suffixes = [
        '\n\n你内心深处，现在是什么颜色的？',
        '\n\n闭上眼感受一下，你的心在说什么？',
        '\n\n如果情绪是一首歌，你现在会听到什么旋律？',
      ]
      greeting += suffixes[daySeed % suffixes.length]
    } else if (isT && isE) {
      const suffixes = [
        '\n\n今天有没有什么让你特别想吐槽的事？',
        '\n\n脑子里在转什么念头？说出来溜溜。',
        '\n\n今天遇到什么有意思的事了吗？',
      ]
      greeting += suffixes[daySeed % suffixes.length]
    } else if (isF && isE) {
      const suffixes = [
        '\n\n今天和谁有了不错的交流吗？',
        '\n\n有没有什么小开心想分享给我？',
        '\n\n你的能量电池现在充了几格？',
      ]
      greeting += suffixes[daySeed % suffixes.length]
    } else if (isT && isI) {
      const suffixes = [
        '\n\n今天有什么事值得复盘一下？',
        '\n\n如果用一个词形容今天，你会选哪个？',
        '\n\n安静地想一想，今天最真实的感受是什么？',
      ]
      greeting += suffixes[daySeed % suffixes.length]
    } else if (isN) {
      greeting += '\n\n今天有什么感触想聊聊的吗？'
    }

    return greeting
  }

  // 从流式内容中提取微行动
  function extractMicroAction(text: string): string | null {
    const patterns = [
      /今天可以[：:]\s*(.+?)(?:\n|$)/,
      /微行动[：:]\s*(.+?)(?:\n|$)/,
      /试着(.{6,30})(?:\n|$)/,
      /可以试试(.{4,25})(?:\n|$)/,
    ]
    for (const p of patterns) {
      const m = text.match(p)
      if (m) return m[1].trim()
    }
    return null
  }

  // 标记微行动完成
  const handleMarkDone = useCallback(async () => {
    setActionDone(true)
    if (sessionIdRef.current) {
      await apiFetch(`/sessions/${sessionIdRef.current}/micro-action-done`, { method: 'PUT' })
    }
  }, [])

  // 读取流式响应的通用逻辑
  async function readStream(res: Response): Promise<string> {
    if (!res.ok || !res.body) {
      const errBody = await res.text().catch(() => 'no body')
      console.error('[chat] API failed:', res.status, errBody)
      throw new Error(`API error: ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') continue
        try {
          const json = JSON.parse(payload)
          if (json.crisis) {
            setShowCrisis(true)
          } else if (json.token) {
            accumulated += json.token
            setStreamingContent(accumulated)
          }
        } catch { /* ignore */ }
      }
    }

    return accumulated
  }

  // 发送消息（可带多张图片）
  async function handleSend(text: string, imageList?: { api: string; thumb: string }[]) {
    if (isStreaming) return
    const hasImages = imageList && imageList.length > 0

    // 用户消息：保存缩略图用于显示和持久化
    const displayContent = hasImages ? (text || `[图片消息]`) : text
    const userMsg: Message = {
      role: 'user',
      content: displayContent,
      timestamp: new Date().toISOString(),
      ...(hasImages ? { imageUrl: imageList[0].thumb } : {}),
    }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setIsStreaming(true)
    setStreamingContent('')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      let res: Response

      if (hasImages) {
        // 带图片：使用 Next.js API route（调用 Kimi vision 模型）
        const supabase = createClient()
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token

        // 只发第一张图给 API（Kimi vision 单次处理效果最好）
        const apiMessages = [
          {
            role: 'user' as const,
            content: [
              { type: 'image_url' as const, image_url: { url: imageList[0].api } },
              { type: 'text' as const, text: text || '请描述这张图片' },
            ],
          },
        ]
        res = await fetch('/projects/zhandoubao/api/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: apiMessages,
            session_id: sessionIdRef.current ?? '',
            useVision: true,
          }),
          signal: controller.signal,
        })
      } else {
        // 纯文本：使用后端 chat API
        res = await apiFetch('/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: text,
            session_id: sessionIdRef.current ?? '',
          }),
          signal: controller.signal,
        })
      }

      const accumulated = await readStream(res)

      const aiMsg: Message = {
        role: 'ai',
        content: accumulated,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
      setStreamingContent('')

      const action = extractMicroAction(accumulated)
      if (action) {
        setMicroAction(action)
        setMicroActionSource(accumulated)
        setActionDone(false)
      }

      // 图片消息：前端主动保存（因为 API route 保存时没有缩略图）
      if (hasImages && sessionIdRef.current) {
        try {
          const allMsgs = [...nextMessages, aiMsg]
          await apiFetch(`/sessions/${sessionIdRef.current}/messages`, {
            method: 'PUT',
            body: JSON.stringify({
              messages: allMsgs,
              ...(action ? { micro_action: action } : {}),
            }),
          })
        } catch { /* 保存失败不影响聊天 */ }
      }

    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      const errMsg: Message = {
        role: 'ai',
        content: '网络有点问题，稍等一下再试试？',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
      setStreamingContent('')
    } finally {
      setIsStreaming(false)
    }
  }

  // 初始加载骨架
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <AppHeader nickname={nickname} avatar={avatar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <span className="flex gap-1.5">
              {[0, 150, 300].map(d => (
                <span
                  key={d}
                  className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
            <p className="text-body-sm">正在准备今天的空间…</p>
          </div>
        </div>
      </div>
    )
  }

  // 消息按日期分组
  const dateGroups = groupMessagesByDate(messages)

  // 渲染微行动卡片（内联在对应的 AI 消息后面）
  const renderMicroAction = (msgContent: string) => {
    if (!microAction) return null
    if (msgContent !== microActionSource) return null
    return (
      <div className="mt-3 mb-1">
        <MicroActionCard
          action={microAction}
          done={actionDone}
          onMarkDone={handleMarkDone}
          onSkip={() => {
            handleSend('这个微行动不太适合我，能换一个吗？')
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader nickname={nickname} avatar={avatar} />

      {/* 对话区 */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-2"
        style={{
          background: `
            radial-gradient(ellipse 60% 60% at 10% 10%, rgba(247,192,162,0.30) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 90% 5%, rgba(232,208,155,0.26) 0%, transparent 65%),
            radial-gradient(ellipse 55% 55% at 50% 80%, rgba(225,188,198,0.22) 0%, transparent 65%),
            radial-gradient(ellipse 60% 60% at 20% 50%, rgba(240,230,202,0.36) 0%, transparent 70%),
            radial-gradient(ellipse 45% 45% at 75% 40%, rgba(200,225,210,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 40% 30%, rgba(225,215,236,0.15) 0%, transparent 50%),
            #FBF7F0`,
          backgroundAttachment: 'fixed',
        }}
      >
        {/* AI 数据告知 */}
        <div className="bg-surface-2 rounded-btn px-3 py-2 mb-4 text-center">
          <p className="text-label text-text-muted leading-relaxed">
            对话内容由 AI 生成，仅供参考，不构成专业建议。<br />
            你的消息会经第三方 AI 服务处理，详见
            <a href="/privacy" className="underline underline-offset-2 text-primary">隐私政策</a>
          </p>
        </div>

        {/* 按日期分组的对话 */}
        {dateGroups.map((group, gi) => (
          <div key={gi}>
            {/* 日期分隔线 */}
            <div className="flex items-center gap-2 mb-5 mt-4">
              <div className="flex-1 h-px bg-primary/10" />
              <span className="text-label text-text-muted px-2">{group.date}</span>
              <div className="flex-1 h-px bg-primary/10" />
            </div>

            {/* 该日期的气泡 + 内联微行动 */}
            <div className="space-y-4">
              {group.messages.map((msg, i) => (
                <Fragment key={`${gi}-${i}`}>
                  <ChatBubble role={msg.role} content={msg.content} imageUrl={msg.imageUrl} timestamp={msg.timestamp} />
                  {msg.role === 'ai' && renderMicroAction(msg.content)}
                </Fragment>
              ))}
            </div>
          </div>
        ))}

        {/* 流式 AI 气泡 */}
        {isStreaming && streamingContent && (
          <div className="mt-4">
            <ChatBubble role="ai" content={streamingContent} isStreaming />
          </div>
        )}

        {/* 等待 AI 响应 */}
        {isStreaming && !streamingContent && (
          <div className="flex mt-4 animate-bubble-in">
            <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-[20px] px-4 py-3 shadow-card">
              <span className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        {/* 微行动卡片：如果没找到对应消息（兼容旧数据），显示在底部 */}
        {microAction && !microActionSource && (
          <div className="mt-5 mb-2">
            <MicroActionCard
              action={microAction}
              done={actionDone}
              onMarkDone={handleMarkDone}
              onSkip={() => {
                handleSend('这个微行动不太适合我，能换一个吗？')
              }}
            />
          </div>
        )}

        {/* 危机卡片 */}
        {showCrisis && (
          <div className="mt-4">
            <CrisisCard onDismiss={() => setShowCrisis(false)} />
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* 输入框 */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  )
}
