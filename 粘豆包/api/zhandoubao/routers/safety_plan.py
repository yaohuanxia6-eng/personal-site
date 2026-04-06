import uuid
from fastapi import APIRouter, Depends
from auth import get_current_user
from database import get_conn
from models import ApiResponse, SafetyPlanUpdate, SafetyPlanOut

router = APIRouter(prefix="/safety-plan", tags=["安全计划"])


@router.get("")
async def get_safety_plan(user_id: str = Depends(get_current_user)):
    """获取用户安全计划"""
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT * FROM safety_plans WHERE user_id = %s", (user_id,))
        row = await cur.fetchone()

    if not row:
        return ApiResponse(data=SafetyPlanOut(
            id="",
            user_id=user_id,
        ).model_dump())

    return ApiResponse(data=SafetyPlanOut(
        id=row["id"],
        user_id=row["user_id"],
        signals=row["signals"],
        self_help=row["self_help"],
        contacts=row["contacts"],
        meaning=row["meaning"],
        updated_at=row["updated_at"],
    ).model_dump())


@router.put("")
async def upsert_safety_plan(body: SafetyPlanUpdate, user_id: str = Depends(get_current_user)):
    """新增或更新安全计划"""
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT id FROM safety_plans WHERE user_id = %s", (user_id,))
        exists = await cur.fetchone()

        if exists:
            updates = []
            values = []
            if body.signals is not None:
                updates.append("signals = %s")
                values.append(body.signals)
            if body.self_help is not None:
                updates.append("self_help = %s")
                values.append(body.self_help)
            if body.contacts is not None:
                updates.append("contacts = %s")
                values.append(body.contacts)
            if body.meaning is not None:
                updates.append("meaning = %s")
                values.append(body.meaning)
            if updates:
                sql = f"UPDATE safety_plans SET {', '.join(updates)} WHERE user_id = %s"
                values.append(user_id)
                await cur.execute(sql, values)
        else:
            plan_id = str(uuid.uuid4())
            await cur.execute(
                "INSERT INTO safety_plans (id, user_id, signals, self_help, contacts, meaning) VALUES (%s, %s, %s, %s, %s, %s)",
                (plan_id, user_id, body.signals, body.self_help, body.contacts, body.meaning),
            )

    return ApiResponse(msg="安全计划已保存")
