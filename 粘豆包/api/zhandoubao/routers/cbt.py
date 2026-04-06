import os
import json
import uuid
from datetime import date
from fastapi import APIRouter, Depends
from openai import OpenAI
from auth import get_current_user
from database import get_conn
from models import ApiResponse, CBTCreate, CBTOut

router = APIRouter(prefix="/cbt", tags=["CBT 认知行为"])

# AI 客户端（用于认知分析）
_ai_client = OpenAI(
    api_key=os.getenv("KIMI_API_KEY", os.getenv("DEEPSEEK_API_KEY", "")),
    base_url=os.getenv("KIMI_BASE_URL", os.getenv("DEEPSEEK_BASE_URL", "https://api.moonshot.cn/v1")),
)
_CHAT_MODEL = os.getenv("AI_MODEL", "moonshot-v1-8k")


def _parse_cbt(row: dict) -> dict:
    return CBTOut(
        id=row["id"],
        user_id=row["user_id"],
        thought=row["thought"],
        score_before=row["score_before"],
        evidence=row["evidence"],
        counter_evidence=row["counter_evidence"],
        friend_advice=row["friend_advice"],
        reframe=row["reframe"],
        score_after=row["score_after"],
        observation=row["observation"],
        created_at=row["created_at"],
    ).model_dump()


@router.post("")
async def create_cbt(body: CBTCreate, user_id: str = Depends(get_current_user)):
    """保存 CBT 记录"""
    record_id = str(uuid.uuid4())

    async with get_conn() as (conn, cur):
        await cur.execute(
            """INSERT INTO cbt_records
               (id, user_id, thought, score_before, evidence, counter_evidence,
                friend_advice, reframe, score_after, observation)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (record_id, user_id, body.thought, body.score_before, body.evidence,
             body.counter_evidence, body.friend_advice, body.reframe,
             body.score_after, body.observation),
        )

    return ApiResponse(data={"id": record_id}, msg="CBT 记录已保存")


@router.get("")
async def list_cbt(
    page: int = 1,
    page_size: int = 20,
    user_id: str = Depends(get_current_user),
):
    """获取 CBT 记录列表（最新优先）"""
    offset = (page - 1) * page_size

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT COUNT(*) AS total FROM cbt_records WHERE user_id = %s",
            (user_id,),
        )
        total = (await cur.fetchone())["total"]

        await cur.execute(
            "SELECT * FROM cbt_records WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (user_id, page_size, offset),
        )
        rows = await cur.fetchall()

    return ApiResponse(data={
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_parse_cbt(r) for r in rows],
    })


@router.get("/today")
async def check_today(user_id: str = Depends(get_current_user)):
    """检查今日是否已有 CBT 记录"""
    today = date.today()

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT * FROM cbt_records WHERE user_id = %s AND DATE(created_at) = %s ORDER BY created_at DESC LIMIT 1",
            (user_id, today),
        )
        row = await cur.fetchone()

    if not row:
        return ApiResponse(data={"has_today": False, "record": None})

    return ApiResponse(data={"has_today": True, "record": _parse_cbt(row)})


@router.post("/analyze")
async def analyze_cbt(body: CBTCreate, user_id: str = Depends(get_current_user)):
    """使用 AI 模型分析认知重构内容，返回有价值的洞察"""
    prompt = f"""你是一个温柔、专业的认知行为治疗助手"粘豆包"。用户刚完成了一次认知重构练习，请根据以下内容给出个性化的分析。

用户的困扰想法：{body.thought}
难受程度：{body.score_before}/10
支持这个想法的证据：{body.evidence or '（未填写）'}
反面证据：{body.counter_evidence or '（未填写）'}
如果好朋友有这个想法会怎么说：{body.friend_advice or '（未填写）'}
重新审视后的看法：{body.reframe}

要求：
1. 先用1-2句话共情她的感受（不要说"我理解你"这类套话）
2. 指出她的想法中可能存在的认知偏差类型（如绝对化思维、灾难化、以偏概全、情绪推理、读心术等），用通俗语言解释
3. 肯定她找到的反面证据和重新审视的能力，指出这说明了什么
4. 如果她写了给朋友的建议，点出"你对别人的善意也值得留给自己"
5. 给一个温暖的总结，可以包含一个小建议
6. 预估经过这次重构后的难受程度（1-10），通常会比之前低2-4分
7. 控制在200字以内
8. 不要用"你应该"、"你要学会"这类说教语气
9. 语气像闺蜜聊天，不像心理咨询师

输出格式（纯JSON，不要markdown代码块）：
{{"observation": "你的分析观察文字", "score_after": 数字}}"""

    try:
        response = _ai_client.chat.completions.create(
            model=_CHAT_MODEL,
            temperature=0.7,
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        ai_text = (response.choices[0].message.content or "").strip()

        # 清理可能的 markdown 代码块
        if "```" in ai_text:
            ai_text = ai_text.split("```")[1]
            if ai_text.startswith("json"):
                ai_text = ai_text[4:]
            ai_text = ai_text.strip()

        result = json.loads(ai_text)
        observation = result.get("observation", "")
        score_after = result.get("score_after", max(1, body.score_before - 2))
    except Exception:
        # AI 调用失败时使用基础分析
        observation = f"能感受到这件事给你带来了 {body.score_before}/10 的难受。但你已经迈出了重要的一步——正视这个想法并找到了反面证据。你重新得出的看法更平衡、更贴近现实，这本身就是一种力量。"
        score_after = max(1, body.score_before - 2)

    # 保存 CBT 记录
    record_id = str(uuid.uuid4())
    async with get_conn() as (conn, cur):
        await cur.execute(
            """INSERT INTO cbt_records
               (id, user_id, thought, score_before, evidence, counter_evidence,
                friend_advice, reframe, score_after, observation)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (record_id, user_id, body.thought, body.score_before, body.evidence,
             body.counter_evidence, body.friend_advice, body.reframe,
             score_after, observation),
        )

    return ApiResponse(data={
        "id": record_id,
        "observation": observation,
        "score_after": score_after,
    })
