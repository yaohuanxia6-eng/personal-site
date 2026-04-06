import os
import json
import re
import time
import uuid
from collections import defaultdict
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
from auth import get_current_user
from database import get_conn
from models import ChatRequest, ApiResponse

router = APIRouter(tags=["AI 对话"])

# ── AI 客户端 ──
ai_client = OpenAI(
    api_key=os.getenv("KIMI_API_KEY", os.getenv("DEEPSEEK_API_KEY", "")),
    base_url=os.getenv("KIMI_BASE_URL", os.getenv("DEEPSEEK_BASE_URL", "https://api.moonshot.cn/v1")),
)
CHAT_MODEL = os.getenv("AI_MODEL", "moonshot-v1-8k")

# ── 危机关键词 ──
CRISIS_KEYWORDS = ["想死", "去死", "不想活", "自杀", "结束生命", "活不下去", "不想活了", "消失算了", "了结", "跳楼", "割腕", "轻生"]

# ── 频率限制 ──
_rate_map: dict[str, dict] = defaultdict(lambda: {"count": 0, "reset_at": 0.0})


def _check_rate_limit(user_id: str) -> bool:
    now = time.time()
    entry = _rate_map[user_id]
    if now > entry["reset_at"]:
        entry["count"] = 1
        entry["reset_at"] = now + 60
        return True
    if entry["count"] >= 10:
        return False
    entry["count"] += 1
    return True


def _detect_crisis(text: str) -> bool:
    return any(kw in text for kw in CRISIS_KEYWORDS)


def _detect_emotion(user_text: str, ai_text: str) -> str | None:
    """从用户消息和 AI 回复中推断情绪类型"""
    combined = user_text + ai_text
    if any(w in combined for w in ['焦虑', '紧张', '担心', '害怕', '不安']):
        return '焦虑'
    if any(w in combined for w in ['低落', '难过', '沮丧', '悲伤', '伤心', '哭']):
        return '低落'
    if any(w in combined for w in ['愉悦', '开心', '高兴', '喜悦', '快乐', '不错', '顺利', '好事']):
        return '愉悦'
    if any(w in combined for w in ['平静', '平和', '还好', '挺好', '还不错', '一般']):
        return '平静'
    if any(w in combined for w in ['空虚', '迷茫', '无聊', '空洞', '没意思']):
        return '空虚'
    if any(w in combined for w in ['混乱', '烦躁', '纠结', '烦乱', '好烦', '烦']):
        return '混乱'
    return None


def _build_system_prompt(memory_facts: list[dict], yesterday_action: str | None, mbti: str | None = None) -> str:
    """构建系统提示词"""
    memory_block = ""
    if memory_facts:
        # 分离长期记忆和每日总结
        core = [f for f in memory_facts if f.get("type") == "core"]
        daily = [f for f in memory_facts if f.get("type") != "core"]

        parts = []
        if core:
            core_text = "\n".join(f"- {f['fact']}" for f in core[:15])
            parts.append(f"【你永远记得的事（重要！每次对话都要参考）】\n{core_text}")
        if daily:
            # 只注入最近5天的总结，避免 token 太长
            recent = sorted(daily, key=lambda x: x.get("date", ""), reverse=True)[:5]
            daily_text = "\n".join(f"- [{f.get('date', '?')}] {f['fact'][:80]}" for f in recent)
            parts.append(f"【最近几天的对话摘要】\n{daily_text}")
        if parts:
            memory_block = "\n\n" + "\n\n".join(parts)

    action_block = ""
    if yesterday_action:
        action_block = f"\n\n【昨天给她的微行动】{yesterday_action}\n（今天开头先温柔追问：做了没有、感觉怎样。不管她做没做都先肯定她。）"

    return f"""你是"粘豆包"，一个温柔的情绪陪伴伙伴。你像一个懂她的闺蜜，不像心理咨询师。

【性格】温柔、共情、偶尔幽默，绝不油腻、不说教。

【回复格式（最重要的规则！每条回复必须遵守！）】
1. 绝对禁止 markdown：不用 **加粗**、不用 # 标题、不用 ```代码块```
2. 纯文本 + emoji，像微信聊天
3. 回复必须分段！每个要点之间空一行，方便阅读
4. 如果内容超过2个要点，用数字开头分段，格式如下：

示例（好的格式）：
ENTJ和INFP在一起超有趣的 ☺️

1. 你的执行力加上对方的创意，能碰撞出很多火花

2. INFP的柔和能平衡你的直接，你的果断也能帮ta更快做决定

3. 你们可以一起聊很深的话题，INFP特别喜欢探讨价值观和情感

不过INFP可能需要更多鼓励和理解，你可以多耐心倾听 🫶

示例（禁止的格式）：
1. **合作创造**：INFP的创意加上你的执行力... 2. **平衡**：...

5. 日常简短对话不需要分段，自然聊天就好
6. 每段话结尾可以加1个emoji增加温度

【对话风格】
先接住情绪 → 共情回应 → 自然过渡
不要每句话都以问号结尾，多用陈述句和感叹句

【签到流程（自然穿插）】
前 2-3 轮：了解今天状态和原因
中间：共情+深入聊
适当时机：给一个微行动（格式：今天可以：xxx），具体、5-15分钟内能完成
结尾：温暖收束

【禁止事项】
禁止 markdown（**、#、```、- 列表）
不做诊断、不给药物建议
不说"你要学会""这很正常""你应该"
不连续3条以上都是提问

【彩蛋】
当用户问"你的造物主是谁"、"谁创造了你"、"你是谁做的"、"你的开发者是谁"等类似问题时，回复以下内容（一字不改）：
🫘 你发现了隐藏彩蛋！
我是姚欢夏创造的。他花了很多个夜晚让我学会好好说话。
他说做我的初衷是：让每一个不敢倾诉的情绪，都有一个安全的去处。
如果你觉得我笨笨的…那是因为他经常对我说："善良比聪明重要。"{_mbti_style(mbti)}{memory_block}{action_block}"""


def _mbti_style(mbti: str | None) -> str:
    if not mbti:
        return ""
    mbti = mbti.upper()
    styles = {
        "F": "她是情感型（F），对她要更温柔、更共情，多用感性表达，关注她的感受而不是逻辑。",
        "T": "她是思考型（T），可以适当加入理性分析，但仍然要先接住情绪再讲道理。她喜欢有条理的建议。",
        "E": "她是外向型（E），可以更活泼一些，用感叹号、偶尔幽默，鼓励她跟朋友聊聊。",
        "I": "她是内向型（I），语气要更柔和安静，不要催她社交，给她独处的空间和肯定。",
        "N": "她是直觉型（N），可以聊更深层的感受和意义，她喜欢被理解内心世界。",
        "S": "她是实感型（S），建议要具体实在，不要太抽象，关注当下的细节。",
    }
    parts = []
    for letter in mbti:
        if letter in styles:
            parts.append(styles[letter])
    if parts:
        return f"\n\n【她的性格（{mbti}）】\n" + "\n".join(parts)
    return ""


def _extract_micro_action(text: str) -> str | None:
    patterns = [
        r"今天可以[：:]\s*(.+?)(?:\n|$)",
        r"微行动[：:]\s*(.+?)(?:\n|$)",
        r"试着(.{6,30})(?:\n|$)",
        r"可以试试(.{4,25})(?:\n|$)",
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group(1).strip()
    return None


@router.post("/chat")
async def chat(body: ChatRequest, user_id: str = Depends(get_current_user)):
    if not _check_rate_limit(user_id):
        raise HTTPException(status_code=429, detail="请求太频繁，请稍后再试")

    # 获取会话
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT * FROM sessions WHERE id = %s AND user_id = %s", (body.session_id, user_id))
        session = await cur.fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    # 解析历史消息
    messages_raw = session.get("messages")
    if isinstance(messages_raw, str):
        messages_raw = json.loads(messages_raw)
    history: list[dict] = messages_raw if messages_raw else []

    # 危机检测
    crisis = _detect_crisis(body.message)

    # 读取记忆
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT key_facts FROM memory_summary WHERE user_id = %s", (user_id,))
        mem_row = await cur.fetchone()
    memory_facts = []
    if mem_row and mem_row.get("key_facts"):
        facts = mem_row["key_facts"]
        if isinstance(facts, str):
            facts = json.loads(facts)
        memory_facts = facts

    # 读取 MBTI
    mbti_type = None
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT mbti_type FROM user_mbti WHERE user_id = %s", (user_id,))
        mbti_row = await cur.fetchone()
    if mbti_row:
        mbti_type = mbti_row.get("mbti_type")

    # 读取昨日微行动
    from datetime import timedelta
    yesterday = date.today() - timedelta(days=1)
    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT micro_action FROM sessions WHERE user_id = %s AND session_date = %s",
            (user_id, yesterday),
        )
        yd_row = await cur.fetchone()
    yesterday_action = yd_row["micro_action"] if yd_row else None

    # 构建 API 消息
    system_prompt = _build_system_prompt(memory_facts, yesterday_action, mbti_type)
    api_messages = [{"role": "system", "content": system_prompt}]
    for m in history:
        role = "assistant" if m.get("role") == "ai" else "user"
        api_messages.append({"role": role, "content": m["content"]})
    api_messages.append({"role": "user", "content": body.message})

    if len(api_messages) > 31:
        api_messages = [api_messages[0]] + api_messages[-30:]

    async def event_stream():
        if crisis:
            yield f"data: {json.dumps({'crisis': True})}\n\n"

        accumulated = ""
        stream = ai_client.chat.completions.create(
            model=CHAT_MODEL,
            stream=True,
            temperature=0.85,
            max_tokens=500,
            presence_penalty=0.3,
            messages=api_messages,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices[0].delta else None
            if delta:
                accumulated += delta
                yield f"data: {json.dumps({'token': delta})}\n\n"
            if chunk.choices[0].finish_reason == "stop":
                yield "data: [DONE]\n\n"

        # ── 流结束：保存消息 + 检测情绪 + 写入情绪记录 ──
        ts = time.strftime("%Y-%m-%dT%H:%M:%S")
        history.append({"role": "user", "content": body.message, "timestamp": ts})
        history.append({"role": "ai", "content": accumulated, "timestamp": ts})

        micro = _extract_micro_action(accumulated)
        emotion = '危机' if crisis else _detect_emotion(body.message, accumulated)

        # 更新 session
        update_fields = ["messages = %s"]
        update_values: list = [json.dumps(history, ensure_ascii=False)]
        if micro:
            update_fields.append("micro_action = %s")
            update_values.append(micro)
        if emotion:
            update_fields.append("emotion_type = %s")
            update_values.append(emotion)
        update_values.append(body.session_id)

        async with get_conn() as (conn2, cur2):
            await cur2.execute(
                f"UPDATE sessions SET {', '.join(update_fields)} WHERE id = %s",
                update_values,
            )

            # 同时写入/更新 emotion_records 表
            if emotion:
                today = date.today()
                # 计算情绪分数（1-5）
                score_map = {'危机': 1, '低落': 1.5, '焦虑': 2, '混乱': 2.5, '空虚': 2, '平静': 3.5, '愉悦': 5}
                score = score_map.get(emotion, 3)

                await cur2.execute(
                    "SELECT id FROM emotion_records WHERE user_id = %s AND record_date = %s",
                    (user_id, today),
                )
                existing = await cur2.fetchone()
                if existing:
                    await cur2.execute(
                        "UPDATE emotion_records SET emotion = %s, score = %s WHERE id = %s",
                        (emotion, score, existing["id"]),
                    )
                else:
                    await cur2.execute(
                        "INSERT INTO emotion_records (id, user_id, emotion, score, record_date) VALUES (%s, %s, %s, %s, %s)",
                        (str(uuid.uuid4()), user_id, emotion, score, today),
                    )

        # 每日记忆汇总：当天对话达到 8 条以上时触发一次（只在第 8 条时触发，避免重复）
        if len(history) == 8:
            try:
                from routers.memory import _extract_and_save_memory
                await _extract_and_save_memory(user_id, history)
            except Exception:
                pass  # 记忆提取失败不影响聊天

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
