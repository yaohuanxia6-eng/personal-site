from fastapi import APIRouter
from models import ApiResponse
from database import get_conn

router = APIRouter(tags=["健康检查"])


@router.get("/health")
async def health():
    return ApiResponse(data={"status": "healthy"})


@router.get("/stats")
async def stats():
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT COUNT(*) AS cnt FROM user_profiles")
        users = (await cur.fetchone())["cnt"]
        await cur.execute("SELECT COUNT(*) AS cnt FROM sessions")
        sessions = (await cur.fetchone())["cnt"]
        await cur.execute("SELECT COUNT(*) AS cnt FROM sessions WHERE session_date = CURDATE()")
        today = (await cur.fetchone())["cnt"]
    return ApiResponse(data={"total_users": users, "total_sessions": sessions, "today_sessions": today})
