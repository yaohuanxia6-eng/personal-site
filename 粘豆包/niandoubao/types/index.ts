// types/index.ts

export const AVATAR_OPTIONS = [
  '🐰','🐱','🐶','🐼','🦊','🐨','🐸','🐔','🦋','🌸','🌻','⭐','🍓','🧸','🎀','🌙','☁️','🌈','🍀','💫','🦄','🐝','🎐','🍡'
] as const

export interface UserProfile {
  id: string
  phone: string | null
  email: string | null
  nickname: string
  avatar: string | null
  reminder_email: string | null
  reminder_time: string
  reminder_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  role: 'ai' | 'user'
  content: string
  timestamp: string
  imageUrl?: string  // 用户上传图片的 base64 DataURL
}

export type EmotionType = '焦虑' | '空虚' | '低落' | '平静' | '愉悦' | '混乱' | '危机'

export interface Session {
  id: string
  user_id: string
  session_date: string
  emotion_type: EmotionType | null
  emotion_snapshot: string | null
  micro_action: string | null
  micro_action_done: boolean
  micro_action_feedback: string | null
  messages: Message[]
  status: 'in_progress' | 'completed'
  created_at: string
}

export interface MemoryFact {
  fact: string
  category: '压力源' | '人际关系' | '近期困境' | '有效策略' | '其他'
  updated_at: string
}

export interface MemorySummary {
  id: string
  user_id: string
  key_facts: MemoryFact[]
  updated_at: string
}

export interface ChatRequest {
  message: string
  session_id: string
}

// MBTI
export type MBTIDimension = 'EI' | 'SN' | 'TF' | 'JP'
export interface MBTIPreference {
  EI: 'E' | 'I' | null
  SN: 'S' | 'N' | null
  TF: 'T' | 'F' | null
  JP: 'J' | 'P' | null
}

// Diary（兼容后端平铺字段格式）
export interface DiaryEntry {
  id: string
  user_id: string
  mood: string
  mood_emoji?: string
  mood_label?: string
  mode: 'guided' | 'free'
  // 后端平铺字段
  event?: string
  body_reaction?: string
  thought?: string
  self_talk?: string
  free_text?: string
  // 旧版嵌套格式（兼容）
  content?: {
    what_happened?: string
    body_reaction?: string
    thoughts?: string
    self_talk?: string
    free_text?: string
  }
  created_at: string
}

// Safety Plan
export interface SafetyPlan {
  id: string
  user_id: string
  crisis_signals: string
  self_actions: string
  contacts: string
  professional_help: string
  reasons_to_live: string
  updated_at: string
}

// Gratitude
export interface GratitudeEntry {
  id: string
  user_id: string
  items: string[]
  created_at: string
}

// CBT
export interface CBTRecord {
  id: string
  user_id: string
  thought: string
  distress_before: number
  distress_after: number
  evidence_for: string
  evidence_against: string
  friend_advice: string
  reframe: string
  insight: string
  created_at: string
}

// Emotion Record (for history page)
export interface EmotionRecord {
  date: string
  emotion_type: EmotionType
  emotion_snapshot: string | null
  micro_action: string | null
  micro_action_done: boolean
}
