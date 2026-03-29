from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pymysql
import os

app = FastAPI(title="粘豆包 API", root_path="/api/zhandoubao")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "host": "localhost",
    "user": os.getenv("ZDB_DB_USER", "zdb_user"),
    "password": os.getenv("ZDB_DB_PASS", "Zdb@2024Secure9"),
    "database": "zhandoubao",
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
}


def get_db():
    return pymysql.connect(**DB_CONFIG)


@app.get("/health")
def health():
    return {"status": "ok", "project": "粘豆包"}


@app.get("/stats")
def stats():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
        conn.close()
        return {"db": "connected"}
    except Exception as e:
        return {"db": "error", "detail": str(e)}
