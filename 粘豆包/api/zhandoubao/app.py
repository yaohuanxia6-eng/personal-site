import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

from database import init_pool, close_pool
from routers import health, sessions, chat, memory, profile, mbti, diary, safety_plan, gratitude, cbt, emotion


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()


app = FastAPI(
    title="粘豆包 API",
    description="AI 情绪陪伴后端服务",
    version="0.1.0",
    root_path="/api/zhandoubao",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 全局异常处理 ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"code": 500, "data": None, "msg": f"服务器内部错误：{str(exc)}"},
    )


# ── 注册路由 ──
app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(memory.router)
app.include_router(profile.router)
app.include_router(mbti.router)
app.include_router(diary.router)
app.include_router(safety_plan.router)
app.include_router(gratitude.router)
app.include_router(cbt.router)
app.include_router(emotion.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8091, reload=True)
