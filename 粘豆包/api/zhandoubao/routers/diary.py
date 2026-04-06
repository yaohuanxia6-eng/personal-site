import uuid
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import get_conn
from models import ApiResponse, DiaryCreate, DiaryOut

router = APIRouter(prefix="/diary", tags=["情绪日记"])


def _parse_diary(row: dict) -> dict:
    return DiaryOut(
        id=row["id"],
        user_id=row["user_id"],
        mode=row["mode"],
        event=row["event"],
        body_reaction=row["body_reaction"],
        thought=row["thought"],
        self_talk=row["self_talk"],
        free_text=row["free_text"],
        mood=row["mood"],
        mood_emoji=row["mood_emoji"],
        created_at=row["created_at"],
    ).model_dump()


@router.post("")
async def create_diary(body: DiaryCreate, user_id: str = Depends(get_current_user)):
    """创建日记条目"""
    entry_id = str(uuid.uuid4())

    async with get_conn() as (conn, cur):
        await cur.execute(
            """INSERT INTO diary_entries
               (id, user_id, mode, event, body_reaction, thought, self_talk, free_text, mood, mood_emoji)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (entry_id, user_id, body.mode, body.event, body.body_reaction,
             body.thought, body.self_talk, body.free_text, body.mood, body.mood_emoji),
        )

    return ApiResponse(data={"id": entry_id}, msg="日记已保存")


@router.get("")
async def list_diary(
    page: int = 1,
    page_size: int = 20,
    user_id: str = Depends(get_current_user),
):
    """获取日记列表（分页，最新优先）"""
    offset = (page - 1) * page_size

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT COUNT(*) AS total FROM diary_entries WHERE user_id = %s",
            (user_id,),
        )
        total = (await cur.fetchone())["total"]

        await cur.execute(
            "SELECT * FROM diary_entries WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (user_id, page_size, offset),
        )
        rows = await cur.fetchall()

    return ApiResponse(data={
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_parse_diary(r) for r in rows],
    })


@router.get("/{entry_id}")
async def get_diary(entry_id: str, user_id: str = Depends(get_current_user)):
    """获取单条日记"""
    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT * FROM diary_entries WHERE id = %s AND user_id = %s",
            (entry_id, user_id),
        )
        row = await cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="日记不存在")

    return ApiResponse(data=_parse_diary(row))


@router.delete("/{entry_id}")
async def delete_diary(entry_id: str, user_id: str = Depends(get_current_user)):
    """删除日记条目"""
    async with get_conn() as (conn, cur):
        await cur.execute(
            "DELETE FROM diary_entries WHERE id = %s AND user_id = %s",
            (entry_id, user_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="日记不存在")

    return ApiResponse(msg="日记已删除")
