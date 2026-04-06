from fastapi import APIRouter, Depends
from auth import get_current_user
from database import get_conn
from models import ApiResponse, ProfileUpdate, ProfileOut

router = APIRouter(prefix="/profile", tags=["用户资料"])


@router.get("")
async def get_profile(user_id: str = Depends(get_current_user)):
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT * FROM user_profiles WHERE id = %s", (user_id,))
        row = await cur.fetchone()

    if not row:
        return ApiResponse(data=ProfileOut(id=user_id).model_dump())

    return ApiResponse(data=ProfileOut(
        id=row["id"],
        email=row["email"],
        nickname=row["nickname"] or "小豆包",
        avatar=row.get("avatar") or "🐰",
        reminder_email=row["reminder_email"],
        reminder_time=str(row["reminder_time"])[:5] if row["reminder_time"] else "21:00",
        reminder_enabled=bool(row["reminder_enabled"]),
        created_at=row["created_at"],
    ).model_dump())


@router.put("")
async def update_profile(body: ProfileUpdate, user_id: str = Depends(get_current_user)):
    async with get_conn() as (conn, cur):
        # upsert: 存在则更新，不存在则插入
        await cur.execute("SELECT id FROM user_profiles WHERE id = %s", (user_id,))
        exists = await cur.fetchone()

        if exists:
            updates = []
            values = []
            if body.nickname is not None:
                updates.append("nickname = %s")
                values.append(body.nickname)
            if body.avatar is not None:
                updates.append("avatar = %s")
                values.append(body.avatar)
            if body.reminder_email is not None:
                updates.append("reminder_email = %s")
                values.append(body.reminder_email)
            if body.reminder_time is not None:
                updates.append("reminder_time = %s")
                values.append(body.reminder_time)
            if body.reminder_enabled is not None:
                updates.append("reminder_enabled = %s")
                values.append(int(body.reminder_enabled))
            if updates:
                sql = f"UPDATE user_profiles SET {', '.join(updates)} WHERE id = %s"
                values.append(user_id)
                await cur.execute(sql, values)
        else:
            await cur.execute(
                "INSERT INTO user_profiles (id, nickname, avatar, reminder_email, reminder_time, reminder_enabled) VALUES (%s, %s, %s, %s, %s, %s)",
                (user_id, body.nickname or "小豆包", body.avatar or "🐰", body.reminder_email, body.reminder_time or "21:00", int(body.reminder_enabled or False)),
            )

    return ApiResponse(msg="保存成功")
