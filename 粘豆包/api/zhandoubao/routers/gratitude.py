import json
import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from auth import get_current_user
from database import get_conn
from models import ApiResponse, GratitudeCreate, GratitudeOut

router = APIRouter(prefix="/gratitude", tags=["感恩记录"])


def _parse_gratitude(row: dict) -> dict:
    items = row["items"]
    if isinstance(items, str):
        items = json.loads(items)
    return GratitudeOut(
        id=row["id"],
        user_id=row["user_id"],
        items=items if items else [],
        day_number=row["day_number"],
        created_at=row["created_at"],
    ).model_dump()


@router.post("")
async def create_gratitude(body: GratitudeCreate, user_id: str = Depends(get_current_user)):
    """创建感恩记录（自动计算第几天）"""
    entry_id = str(uuid.uuid4())

    async with get_conn() as (conn, cur):
        # 计算 day_number：该用户已有多少条 + 1
        await cur.execute(
            "SELECT COUNT(*) AS cnt FROM gratitude_entries WHERE user_id = %s",
            (user_id,),
        )
        cnt = (await cur.fetchone())["cnt"]
        day_number = cnt + 1

        await cur.execute(
            "INSERT INTO gratitude_entries (id, user_id, items, day_number) VALUES (%s, %s, %s, %s)",
            (entry_id, user_id, json.dumps(body.items, ensure_ascii=False), day_number),
        )

    return ApiResponse(data={"id": entry_id, "day_number": day_number}, msg="感恩记录已保存")


@router.get("")
async def list_gratitude(
    page: int = 1,
    page_size: int = 20,
    user_id: str = Depends(get_current_user),
):
    """获取感恩记录列表（最新优先）"""
    offset = (page - 1) * page_size

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT COUNT(*) AS total FROM gratitude_entries WHERE user_id = %s",
            (user_id,),
        )
        total = (await cur.fetchone())["total"]

        await cur.execute(
            "SELECT * FROM gratitude_entries WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (user_id, page_size, offset),
        )
        rows = await cur.fetchall()

    return ApiResponse(data={
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_parse_gratitude(r) for r in rows],
    })


@router.get("/streak")
async def get_streak(user_id: str = Depends(get_current_user)):
    """获取连续打卡信息"""
    async with get_conn() as (conn, cur):
        # 总天数
        await cur.execute(
            "SELECT COUNT(*) AS total FROM gratitude_entries WHERE user_id = %s",
            (user_id,),
        )
        total = (await cur.fetchone())["total"]

        # 获取所有记录日期（按日期降序），计算连续天数
        await cur.execute(
            "SELECT DISTINCT DATE(created_at) AS d FROM gratitude_entries WHERE user_id = %s ORDER BY d DESC",
            (user_id,),
        )
        rows = await cur.fetchall()

    consecutive = 0
    if rows:
        today = date.today()
        expected = today
        for row in rows:
            record_date = row["d"]
            if isinstance(record_date, str):
                from datetime import datetime as dt
                record_date = dt.strptime(record_date, "%Y-%m-%d").date()
            if record_date == expected:
                consecutive += 1
                expected -= timedelta(days=1)
            elif record_date == expected - timedelta(days=0):
                # 同一天多条不重复计
                continue
            else:
                break

    return ApiResponse(data={
        "total_days": total,
        "consecutive_days": consecutive,
    })
