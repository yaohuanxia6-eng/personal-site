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

# ── 每日总结 Prompt ──
DAILY_SUMMARY_PROMPT = """你是用户的私人记忆助手"粘豆包"。请完成两个任务：

【任务一：每日总结】
将今天的对话浓缩成一条日记式总结（100-200字）。
- 用第三人称"她"记录
- 像写日记一样，包含具体细节和情感
- 末尾用 | 分隔，写分类标签：日常 | 压力 | 人际 | 成长 | 情绪

【任务二：长期记忆提取】
从对话中识别值得永久记住的稳定事实。只提取以下类型：
- 重要人物（名字、关系、特征）
- 长期状态（职业、爱好、习惯、性格特点）
- 重要生活事件（搬家、分手、入职、生病等）
- 有效策略（什么方法能让她开心/平静）
- 不提取当天临时情绪或一次性事件

输出格式（严格JSON，不要markdown代码块）：
{"summary": "每日总结文字|分类标签", "core_facts": [{"fact": "她男朋友叫小李，在互联网公司做开发", "category": "人物"}, ...]}

core_facts 的 category 只能是：人物 | 状态 | 事件 | 策略
如果没有值得永久记住的新事实，core_facts 返回空数组。
每次最多提取3条 core_facts。

对话内容：
"""


async def _extract_and_save_memory(user_id: str, messages: list[dict]):
    """从对话中提取每日总结 + 长期记忆"""
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
            max_tokens=800,
            messages=[{"role": "user", "content": DAILY_SUMMARY_PROMPT + dialog}],
        )
        ai_text = (response.choices[0].message.content or "").strip()
    except Exception:
        return

    if not ai_text:
        return

    # 解析 JSON
    summary_text = ""
    core_facts = []
    try:
        # 清理可能的 markdown 代码块
        cleaned = ai_text
        if "```" in cleaned:
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        parsed = json.loads(cleaned)
        summary_text = parsed.get("summary", "")
        core_facts = parsed.get("core_facts", [])
    except (json.JSONDecodeError, IndexError):
        # JSON 解析失败，尝试当作纯文本总结
        summary_text = ai_text

    today_str = date.today().strftime("%Y-%m-%d")
    now = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    # ── 读取现有记忆 ──
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT key_facts FROM memory_summary WHERE user_id = %s", (user_id,))
        row = await cur.fetchone()

    existing = []
    if row and row.get("key_facts"):
        existing = row["key_facts"] if isinstance(row["key_facts"], list) else json.loads(row["key_facts"])

    # ── 处理每日总结（type=daily，滚动30天）──
    if summary_text:
        category = "日常"
        if "|" in summary_text:
            parts = summary_text.rsplit("|", 1)
            summary_text = parts[0].strip()
            category = parts[1].strip() if len(parts) > 1 else "日常"

        # 替换今天的总结
        existing = [e for e in existing if not (e.get("type") == "daily" and e.get("date") == today_str)]
        existing.append({
            "type": "daily",
            "fact": summary_text,
            "category": category,
            "date": today_str,
            "updated_at": now,
        })

    # ── 处理长期记忆（type=core，永久保留）──
    existing_core = [e for e in existing if e.get("type") == "core"]
    existing_core_texts = [e.get("fact", "") for e in existing_core]

    for cf in core_facts:
        fact_text = cf.get("fact", "").strip()
        if not fact_text:
            continue
        # 去重：如果已有非常相似的记忆就跳过
        is_duplicate = any(
            _is_similar(fact_text, existing_text)
            for existing_text in existing_core_texts
        )
        if not is_duplicate:
            existing.append({
                "type": "core",
                "fact": fact_text,
                "category": cf.get("category", "状态"),
                "date": today_str,
                "updated_at": now,
            })
            existing_core_texts.append(fact_text)

    # ── 清理：daily 只保留30天，core 最多50条 ──
    dailies = [e for e in existing if e.get("type") == "daily"]
    cores = [e for e in existing if e.get("type") == "core"]

    dailies.sort(key=lambda x: x.get("date", ""))
    if len(dailies) > 30:
        dailies = dailies[-30:]

    cores.sort(key=lambda x: x.get("updated_at", ""))
    if len(cores) > 50:
        cores = cores[-50:]

    final = cores + dailies

    # ── 保存 ──
    async with get_conn() as (conn, cur):
        facts_json = json.dumps(final, ensure_ascii=False)
        if row:
            await cur.execute("UPDATE memory_summary SET key_facts = %s WHERE user_id = %s", (facts_json, user_id))
        else:
            await cur.execute(
                "INSERT INTO memory_summary (id, user_id, key_facts) VALUES (%s, %s, %s)",
                (str(uuid.uuid4()), user_id, facts_json),
            )


def _is_similar(text1: str, text2: str) -> bool:
    """简单的相似度判断：共同字符占比超过60%认为重复"""
    if not text1 or not text2:
        return False
    set1 = set(text1)
    set2 = set(text2)
    overlap = len(set1 & set2)
    shorter = min(len(set1), len(set2))
    return overlap / shorter > 0.6 if shorter > 0 else False


@router.get("")
async def get_memory(user_id: str = Depends(get_current_user)):
    """获取当前用户的记忆（两层）"""
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT * FROM memory_summary WHERE user_id = %s", (user_id,))
        row = await cur.fetchone()

    if not row:
        return ApiResponse(data={"user_id": user_id, "key_facts": [], "core_facts": [], "updated_at": None})

    facts = row.get("key_facts")
    if isinstance(facts, str):
        facts = json.loads(facts)

    all_facts = facts or []

    # 分离两层
    core_facts = [e for e in all_facts if e.get("type") == "core"]
    daily_facts = [e for e in all_facts if e.get("type") == "daily"]

    # 兼容旧数据（没有 type 字段的当作 daily）
    legacy = [e for e in all_facts if "type" not in e]
    daily_facts.extend(legacy)

    # 排序
    core_facts.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    daily_facts.sort(key=lambda x: x.get("date", x.get("updated_at", "")), reverse=True)

    return ApiResponse(data={
        "user_id": user_id,
        "key_facts": daily_facts,
        "core_facts": core_facts,
        "updated_at": row.get("updated_at"),
    })


@router.post("/extract")
async def extract_memory(body: MemoryExtractRequest, user_id: str = Depends(get_current_user)):
    """从已完成会话中提炼记忆"""
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
