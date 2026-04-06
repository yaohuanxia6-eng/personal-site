import os
import json
import uuid
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from auth import get_current_user
from database import get_conn
from models import ApiResponse, MemoryExtractRequest

router = APIRouter(prefix="/memory", tags=["记忆系统"])

ai_client = OpenAI(
    api_key=os.getenv("KIMI_API_KEY", os.getenv("DEEPSEEK_API_KEY", "")),
    base_url=os.getenv("KIMI_BASE_URL", os.getenv("DEEPSEEK_BASE_URL", "https://api.moonshot.cn/v1")),
)
CHAT_MODEL = os.getenv("AI_MODEL", "moonshot-v1-8k")

DAILY_SUMMARY_PROMPT = """你是用户的私人记忆助手"粘豆包"。请将今天的对话浓缩成一条日记式的总结。

要求：
1. 用第三人称"她"来记录（不要用"用户"）
2. 总结要像写日记一样，包含具体细节和情感
3. 可以分2-3段，涵盖：今天聊了什么主题、她的核心感受、有价值的发现或决定
4. 控制在100-200字
5. 不要罗列要点，要像叙述故事一样自然流畅
6. 如果对话内容太短（不到4条），输出空字符串 ""
7. 在末尾用 | 分隔，写一个分类标签：日常 | 压力 | 人际 | 成长 | 情绪

示例输出：
她今天聊到最近在准备跳槽面试，目标方向是AI产品经理。主要的焦虑来源是觉得自己技术背景不够硬，担心面试时被算法问题难住。不过在聊的过程中她自己也意识到，产品经理的核心竞争力不是写代码，而是理解用户需求和协调资源的能力。\n\n她提到男朋友最近也在鼓励她，说"你比你想象的厉害"。这句话让她挺感动的。今天给的微行动是"花15分钟列出自己做过的3个最自豪的项目"，她说会试试。|压力

对话内容：
"""


async def _extract_and_save_memory(user_id: str, messages: list[dict]):
    """内部函数：从对话中提取今日总结并保存"""
    if len(messages) < 4:
        return

    dialog = "\n".join(
        f"{'她' if m.get('role') == 'user' else '粘豆包'}: {m.get('content', '')}"
        for m in messages
    )

    try:
        response = ai_client.chat.completions.create(
            model=CHAT_MODEL,
            temperature=0.3,
            max_tokens=500,
            messages=[{"role": "user", "content": DAILY_SUMMARY_PROMPT + dialog}],
        )

        ai_text = (response.choices[0].message.content or "").strip()
    except Exception:
        return

    if not ai_text or ai_text == '""':
        return

    # 解析分类标签
    category = "日常"
    if "|" in ai_text:
        parts = ai_text.rsplit("|", 1)
        ai_text = parts[0].strip()
        category = parts[1].strip() if len(parts) > 1 else "日常"

    today_str = date.today().strftime("%Y-%m-%d")
    now = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    new_entry = {
        "fact": ai_text,
        "category": category,
        "date": today_str,
        "updated_at": now,
    }

    async with get_conn() as (conn, cur):
        await cur.execute("SELECT key_facts FROM memory_summary WHERE user_id = %s", (user_id,))
        row = await cur.fetchone()

    existing = []
    if row and row.get("key_facts"):
        existing = row["key_facts"] if isinstance(row["key_facts"], list) else json.loads(row["key_facts"])

    # 替换今天的记录（同一天只保留一条）
    existing = [e for e in existing if e.get("date") != today_str]
    existing.append(new_entry)

    # 保留最近 30 天的记录
    if len(existing) > 30:
        existing.sort(key=lambda x: x.get("date", ""))
        existing = existing[-30:]

    async with get_conn() as (conn, cur):
        facts_json = json.dumps(existing, ensure_ascii=False)
        if row:
            await cur.execute("UPDATE memory_summary SET key_facts = %s WHERE user_id = %s", (facts_json, user_id))
        else:
            await cur.execute(
                "INSERT INTO memory_summary (id, user_id, key_facts) VALUES (%s, %s, %s)",
                (str(uuid.uuid4()), user_id, facts_json),
            )


@router.get("")
async def get_memory(user_id: str = Depends(get_current_user)):
    """获取当前用户的记忆"""
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT * FROM memory_summary WHERE user_id = %s", (user_id,))
        row = await cur.fetchone()

    if not row:
        return ApiResponse(data={"user_id": user_id, "key_facts": [], "updated_at": None})

    facts = row.get("key_facts")
    if isinstance(facts, str):
        facts = json.loads(facts)

    # 按日期倒序排列
    if facts:
        facts.sort(key=lambda x: x.get("date", x.get("updated_at", "")), reverse=True)

    return ApiResponse(data={
        "user_id": user_id,
        "key_facts": facts or [],
        "updated_at": row.get("updated_at"),
    })


@router.post("/extract")
async def extract_memory(body: MemoryExtractRequest, user_id: str = Depends(get_current_user)):
    """从已完成会话中提炼记忆事实"""
    session_id = body.session_id

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT * FROM sessions WHERE id = %s AND user_id = %s",
            (session_id, user_id),
        )
        session = await cur.fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    messages_raw = session.get("messages")
    if isinstance(messages_raw, str):
        messages_raw = json.loads(messages_raw)
    if not messages_raw:
        return ApiResponse(msg="对话为空，无法提炼")

    await _extract_and_save_memory(user_id, messages_raw)
    return ApiResponse(msg="记忆提炼完成")
