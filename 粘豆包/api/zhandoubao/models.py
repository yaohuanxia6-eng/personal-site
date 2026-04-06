from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, date, time


# ── 通用响应 ──

class ApiResponse(BaseModel):
    code: int = 0
    data: object = None
    msg: str = "ok"


# ── 用户资料 ──

class ProfileUpdate(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50)
    avatar: Optional[str] = Field(None, max_length=10)
    reminder_email: Optional[str] = None
    reminder_time: Optional[str] = None  # HH:MM 格式
    reminder_enabled: Optional[bool] = None


class ProfileOut(BaseModel):
    id: str
    email: Optional[str] = None
    nickname: str = "小豆包"
    avatar: Optional[str] = "🐰"
    reminder_email: Optional[str] = None
    reminder_time: str = "21:00"
    reminder_enabled: bool = False
    created_at: Optional[datetime] = None


# ── 会话 ──

EmotionType = Literal["焦虑", "空虚", "低落", "平静", "愉悦", "混乱", "危机"]


class MessageItem(BaseModel):
    role: Literal["ai", "user"]
    content: str
    timestamp: Optional[str] = None


class SessionOut(BaseModel):
    id: str
    user_id: str
    session_date: date
    emotion_type: Optional[str] = None
    micro_action: Optional[str] = None
    micro_action_done: bool = False
    messages: list[MessageItem] = []
    status: str = "in_progress"
    created_at: Optional[datetime] = None


class SessionCompleteRequest(BaseModel):
    """完成会话时可选更新 messages 和 status"""
    messages: Optional[list[MessageItem]] = None
    status: Optional[str] = None


class SessionMessagesUpdate(BaseModel):
    """AI 回复后保存聊天消息"""
    messages: list[MessageItem]
    micro_action: Optional[str] = None
    emotion_type: Optional[str] = None


class SessionHistoryItem(BaseModel):
    """历史会话列表项（不含 messages）"""
    id: str
    session_date: date
    emotion_type: Optional[str] = None
    micro_action: Optional[str] = None
    micro_action_done: bool = False
    status: str = "in_progress"


# ── 对话请求 ──

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=2000)
    session_id: str


# ── 记忆 ──

class MemoryFact(BaseModel):
    fact: str
    category: Literal["压力源", "人际关系", "近期困境", "有效策略", "其他"]
    updated_at: Optional[str] = None


class MemoryOut(BaseModel):
    user_id: str
    key_facts: list[MemoryFact] = []
    updated_at: Optional[datetime] = None


class MemoryExtractRequest(BaseModel):
    """记忆提炼请求"""
    session_id: str


# ── MBTI ──

class MBTIUpdate(BaseModel):
    ei: Optional[str] = Field(None, max_length=1, pattern="^[EI]$")
    sn: Optional[str] = Field(None, max_length=1, pattern="^[SN]$")
    tf: Optional[str] = Field(None, max_length=1, pattern="^[TF]$")
    jp: Optional[str] = Field(None, max_length=1, pattern="^[JP]$")


class MBTIOut(BaseModel):
    id: str
    user_id: str
    ei: Optional[str] = None
    sn: Optional[str] = None
    tf: Optional[str] = None
    jp: Optional[str] = None
    mbti_type: Optional[str] = None
    created_at: Optional[datetime] = None


# ── 日记 ──

class DiaryCreate(BaseModel):
    mode: Literal["guided", "free"] = "guided"
    event: Optional[str] = None
    body_reaction: Optional[str] = None
    thought: Optional[str] = None
    self_talk: Optional[str] = None
    free_text: Optional[str] = None
    mood: Optional[str] = Field(None, max_length=10)
    mood_emoji: Optional[str] = Field(None, max_length=10)


class DiaryOut(BaseModel):
    id: str
    user_id: str
    mode: str = "guided"
    event: Optional[str] = None
    body_reaction: Optional[str] = None
    thought: Optional[str] = None
    self_talk: Optional[str] = None
    free_text: Optional[str] = None
    mood: Optional[str] = None
    mood_emoji: Optional[str] = None
    created_at: Optional[datetime] = None


# ── 安全计划 ──

class SafetyPlanUpdate(BaseModel):
    signals: Optional[str] = None
    self_help: Optional[str] = None
    contacts: Optional[str] = None
    meaning: Optional[str] = None


class SafetyPlanOut(BaseModel):
    id: str
    user_id: str
    signals: Optional[str] = None
    self_help: Optional[str] = None
    contacts: Optional[str] = None
    meaning: Optional[str] = None
    updated_at: Optional[datetime] = None


# ── 感恩记录 ──

class GratitudeCreate(BaseModel):
    items: list[str] = Field(..., min_length=1)


class GratitudeOut(BaseModel):
    id: str
    user_id: str
    items: list[str] = []
    day_number: int = 1
    created_at: Optional[datetime] = None


# ── CBT 认知行为 ──

class CBTCreate(BaseModel):
    thought: str = Field(..., max_length=2000)
    score_before: int = Field(5, ge=1, le=10)
    evidence: Optional[str] = None
    counter_evidence: Optional[str] = None
    friend_advice: Optional[str] = None
    reframe: str = Field(..., max_length=2000)
    score_after: Optional[int] = Field(None, ge=1, le=10)
    observation: Optional[str] = None


class CBTOut(BaseModel):
    id: str
    user_id: str
    thought: str
    score_before: int = 5
    evidence: Optional[str] = None
    counter_evidence: Optional[str] = None
    friend_advice: Optional[str] = None
    reframe: str
    score_after: Optional[int] = None
    observation: Optional[str] = None
    created_at: Optional[datetime] = None


# ── 情绪记录 ──

class EmotionRecordCreate(BaseModel):
    emotion: str = Field(..., max_length=10)
    sub_emotion: Optional[str] = Field(None, max_length=20)
    score: Optional[float] = Field(None, ge=1, le=5)
    note: Optional[str] = None
    record_date: date


class EmotionRecordOut(BaseModel):
    id: str
    user_id: str
    emotion: str
    sub_emotion: Optional[str] = None
    score: Optional[float] = None
    note: Optional[str] = None
    record_date: date
    created_at: Optional[datetime] = None
