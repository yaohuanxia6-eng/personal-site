import uuid
from fastapi import APIRouter, Depends
from auth import get_current_user
from database import get_conn
from models import ApiResponse, MBTIUpdate, MBTIOut

router = APIRouter(prefix="/mbti", tags=["MBTI"])


@router.get("")
async def get_mbti(user_id: str = Depends(get_current_user)):
    """获取用户 MBTI 偏好"""
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT * FROM user_mbti WHERE user_id = %s", (user_id,))
        row = await cur.fetchone()

    if not row:
        return ApiResponse(data=None, msg="尚未设置 MBTI")

    return ApiResponse(data=MBTIOut(
        id=row["id"],
        user_id=row["user_id"],
        ei=row["ei"],
        sn=row["sn"],
        tf=row["tf"],
        jp=row["jp"],
        mbti_type=row["mbti_type"],
        created_at=row["created_at"],
    ).model_dump())


@router.put("")
async def upsert_mbti(body: MBTIUpdate, user_id: str = Depends(get_current_user)):
    """新增或更新 MBTI 偏好"""
    # 计算 mbti_type
    parts = [body.ei, body.sn, body.tf, body.jp]
    mbti_type = "".join(p for p in parts if p) if all(parts) else None

    async with get_conn() as (conn, cur):
        await cur.execute("SELECT id FROM user_mbti WHERE user_id = %s", (user_id,))
        exists = await cur.fetchone()

        if exists:
            updates = []
            values = []
            for col, val in [("ei", body.ei), ("sn", body.sn), ("tf", body.tf), ("jp", body.jp)]:
                if val is not None:
                    updates.append(f"{col} = %s")
                    values.append(val)
            updates.append("mbti_type = %s")
            values.append(mbti_type)

            if not mbti_type:
                # 重新计算：先获取已有值再合并
                await cur.execute("SELECT ei, sn, tf, jp FROM user_mbti WHERE user_id = %s", (user_id,))
                old = await cur.fetchone()
                merged = {
                    "ei": body.ei or old["ei"],
                    "sn": body.sn or old["sn"],
                    "tf": body.tf or old["tf"],
                    "jp": body.jp or old["jp"],
                }
                if all(merged.values()):
                    mbti_type = merged["ei"] + merged["sn"] + merged["tf"] + merged["jp"]
                    # 更新 values 中最后一个
                    values[-1] = mbti_type

            sql = f"UPDATE user_mbti SET {', '.join(updates)} WHERE user_id = %s"
            values.append(user_id)
            await cur.execute(sql, values)
        else:
            record_id = str(uuid.uuid4())
            await cur.execute(
                "INSERT INTO user_mbti (id, user_id, ei, sn, tf, jp, mbti_type) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (record_id, user_id, body.ei, body.sn, body.tf, body.jp, mbti_type),
            )

    return ApiResponse(msg="MBTI 已保存")
