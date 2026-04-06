import uuid
from datetime import date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from auth import get_current_user
from database import get_conn
from models import ApiResponse, EmotionRecordCreate, EmotionRecordOut

router = APIRouter(prefix="/emotion", tags=["情绪记录"])


def _parse_emotion(row: dict) -> dict:
    score = row["score"]
    if isinstance(score, Decimal):
        score = float(score)
    return EmotionRecordOut(
        id=row["id"],
        user_id=row["user_id"],
        emotion=row["emotion"],
        sub_emotion=row["sub_emotion"],
        score=score,
        note=row["note"],
        record_date=row["record_date"],
        created_at=row["created_at"],
    ).model_dump()


@router.post("")
async def upsert_emotion(body: EmotionRecordCreate, user_id: str = Depends(get_current_user)):
    """创建或更新当日情绪记录（按日期 upsert）"""
    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT id FROM emotion_records WHERE user_id = %s AND record_date = %s",
            (user_id, body.record_date),
        )
        exists = await cur.fetchone()

        if exists:
            await cur.execute(
                """UPDATE emotion_records
                   SET emotion = %s, sub_emotion = %s, score = %s, note = %s
                   WHERE user_id = %s AND record_date = %s""",
                (body.emotion, body.sub_emotion, body.score, body.note,
                 user_id, body.record_date),
            )
            record_id = exists["id"]
        else:
            record_id = str(uuid.uuid4())
            await cur.execute(
                """INSERT INTO emotion_records
                   (id, user_id, emotion, sub_emotion, score, note, record_date)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (record_id, user_id, body.emotion, body.sub_emotion,
                 body.score, body.note, body.record_date),
            )

    return ApiResponse(data={"id": record_id}, msg="情绪记录已保存")


@router.get("/history")
async def get_history(
    days: int = Query(30, ge=1, le=365),
    user_id: str = Depends(get_current_user),
):
    """获取指定天数内的情绪记录"""
    start_date = date.today() - timedelta(days=days)

    async with get_conn() as (conn, cur):
        await cur.execute(
            """SELECT * FROM emotion_records
               WHERE user_id = %s AND record_date >= %s
               ORDER BY record_date DESC""",
            (user_id, start_date),
        )
        rows = await cur.fetchall()

    return ApiResponse(data=[_parse_emotion(r) for r in rows])


@router.get("/trend")
async def get_trend(
    days: int = Query(30, ge=1, le=365),
    user_id: str = Depends(get_current_user),
):
    """获取情绪趋势数据（用于图表）"""
    start_date = date.today() - timedelta(days=days)

    async with get_conn() as (conn, cur):
        await cur.execute(
            """SELECT record_date, emotion, score
               FROM emotion_records
               WHERE user_id = %s AND record_date >= %s
               ORDER BY record_date ASC""",
            (user_id, start_date),
        )
        rows = await cur.fetchall()

    trend = []
    for row in rows:
        score = row["score"]
        if isinstance(score, Decimal):
            score = float(score)
        trend.append({
            "date": str(row["record_date"]),
            "emotion": row["emotion"],
            "score": score,
        })

    return ApiResponse(data=trend)
