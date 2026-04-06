import os
import aiomysql
from contextlib import asynccontextmanager

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "zdb_user"),
    "password": os.getenv("DB_PASSWORD", ""),
    "db": os.getenv("DB_NAME", "zhandoubao"),
    "charset": "utf8mb4",
    "autocommit": True,
}

_pool: aiomysql.Pool | None = None


async def init_pool():
    global _pool
    _pool = await aiomysql.create_pool(**DB_CONFIG, minsize=2, maxsize=10)


async def close_pool():
    global _pool
    if _pool:
        _pool.close()
        await _pool.wait_closed()
        _pool = None


@asynccontextmanager
async def get_conn():
    assert _pool is not None, "Database pool not initialized"
    async with _pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            yield conn, cur
