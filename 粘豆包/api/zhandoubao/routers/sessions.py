import json
import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import get_conn
from models import (
    ApiResponse, SessionOut, MessageItem,
    SessionCompleteRequest, SessionMessagesUpdate, SessionHistoryItem,
)

router = APIRouter(prefix="/sessions", tags=["会话管理"])


def _parse_session(row: dict) -> dict:
    """将数据库行转为 SessionOut 格式"""
    messages_raw = row.get("messages")
    if isinstance(messages_raw, str):
        messages_raw = json.loads(messages_raw)
    messages = messages_raw if messages_raw else []

    return SessionOut(
        id=row["id"],
        user_id=row["user_id"],
        session_date=row["session_date"],
        emotion_type=row.get("emotion_type"),
        micro_action=row.get("micro_action"),
        micro_action_done=bool(row.get("micro_action_done", 0)),
        messages=[MessageItem(**m) if isinstance(m, dict) else m for m in messages],
        status=row.get("status", "in_progress"),
        created_at=row.get("created_at"),
    ).model_dump()


@router.post("/today")
async def get_or_create_today(user_id: str = Depends(get_current_user)):
    """获取或创建今日会话"""
    today = date.today()

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT * FROM sessions WHERE user_id = %s AND session_date = %s",
            (user_id, today),
        )
        row = await cur.fetchone()

        if row:
            return ApiResponse(data=_parse_session(row))

        # 创建新会话
        session_id = str(uuid.uuid4())
        await cur.execute(
            "INSERT INTO sessions (id, user_id, session_date, messages, status) VALUES (%s, %s, %s, %s, %s)",
            (session_id, user_id, today, "[]", "in_progress"),
        )

        return ApiResponse(data=SessionOut(
            id=session_id,
            user_id=user_id,
            session_date=today,
        ).model_dump())


@router.get("/yesterday")
async def get_yesterday(user_id: str = Depends(get_current_user)):
    """获取昨日会话（用于追问微行动）"""
    yesterday = date.today() - timedelta(days=1)

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT * FROM sessions WHERE user_id = %s AND session_date = %s",
            (user_id, yesterday),
        )
        row = await cur.fetchone()

    if not row:
        return ApiResponse(data=None, msg="昨日无会话")

    return ApiResponse(data=_parse_session(row))


@router.get("/history")
async def get_history(user_id: str = Depends(get_current_user)):
    """获取最近 90 天的会话历史（不含 messages）"""
    cutoff = date.today() - timedelta(days=90)

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT id, session_date, emotion_type, micro_action, micro_action_done, status "
            "FROM sessions WHERE user_id = %s AND session_date >= %s "
            "ORDER BY session_date DESC",
            (user_id, cutoff),
        )
        rows = await cur.fetchall()

    items = [
        SessionHistoryItem(
            id=r["id"],
            session_date=r["session_date"],
            emotion_type=r.get("emotion_type"),
            micro_action=r.get("micro_action"),
            micro_action_done=bool(r.get("micro_action_done", 0)),
            status=r.get("status", "in_progress"),
        ).model_dump()
        for r in rows
    ]

    return ApiResponse(data=items)


@router.put("/{session_id}/complete")
async def complete_session(
    session_id: str,
    body: SessionCompleteRequest = None,
    user_id: str = Depends(get_current_user),
):
    """标记会话为已完成，可选更新 messages 和 status"""
    # 构建动态 SET 子句
    fields = []
    values = []

    if body and body.messages is not None:
        fields.append("messages = %s")
        values.append(json.dumps(
            [m.model_dump() for m in body.messages], ensure_ascii=False
        ))

    if body and body.status is not None:
        fields.append("status = %s")
        values.append(body.status)
    else:
        # 默认标记为 completed
        fields.append("status = %s")
        values.append("completed")

    values.extend([session_id, user_id])

    async with get_conn() as (conn, cur):
        await cur.execute(
            f"UPDATE sessions SET {', '.join(fields)} WHERE id = %s AND user_id = %s",
            tuple(values),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="会话不存在")

    return ApiResponse(msg="会话已完成")


@router.put("/{session_id}/micro-action-done")
async def mark_micro_action_done(session_id: str, user_id: str = Depends(get_current_user)):
    """标记微行动已完成"""
    async with get_conn() as (conn, cur):
        await cur.execute(
            "UPDATE sessions SET micro_action_done = 1 WHERE id = %s AND user_id = %s",
            (session_id, user_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="会话不存在")

    return ApiResponse(msg="微行动已标记完成")


@router.put("/{session_id}/messages")
async def update_messages(
    session_id: str,
    body: SessionMessagesUpdate,
    user_id: str = Depends(get_current_user),
):
    """保存聊天消息（AI 回复后调用），可选更新 micro_action 和 emotion_type"""
    fields = ["messages = %s"]
    values = [json.dumps(
        [m.model_dump() for m in body.messages], ensure_ascii=False
    )]

    if body.micro_action is not None:
        fields.append("micro_action = %s")
        values.append(body.micro_action)

    if body.emotion_type is not None:
        fields.append("emotion_type = %s")
        values.append(body.emotion_type)

    values.extend([session_id, user_id])

    async with get_conn() as (conn, cur):
        await cur.execute(
            f"UPDATE sessions SET {', '.join(fields)} WHERE id = %s AND user_id = %s",
            tuple(values),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="会话不存在")

    return ApiResponse(msg="消息已保存")
