"""
建表脚本 — 可重复执行（IF NOT EXISTS）
运行方式: python init_db.py
"""
import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "zdb_user"),
    "password": os.getenv("DB_PASSWORD", ""),
    "db": os.getenv("DB_NAME", "zhandoubao"),
    "charset": "utf8mb4",
}

TABLES = [
    """
    CREATE TABLE IF NOT EXISTS user_profiles (
        id          VARCHAR(36) PRIMARY KEY COMMENT 'Supabase user ID',
        email       VARCHAR(255) DEFAULT NULL,
        nickname    VARCHAR(50) DEFAULT '小豆包',
        avatar      VARCHAR(10) DEFAULT '🐰',
        reminder_email VARCHAR(255) DEFAULT NULL,
        reminder_time  TIME DEFAULT '21:00:00',
        reminder_enabled TINYINT(1) DEFAULT 0,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS sessions (
        id           VARCHAR(36) PRIMARY KEY,
        user_id      VARCHAR(36) NOT NULL,
        session_date DATE NOT NULL,
        emotion_type VARCHAR(20) DEFAULT NULL,
        emotion_snapshot TEXT DEFAULT NULL,
        micro_action TEXT DEFAULT NULL,
        micro_action_done TINYINT(1) DEFAULT 0,
        micro_action_feedback TEXT DEFAULT NULL,
        messages     JSON DEFAULT NULL,
        status       VARCHAR(20) DEFAULT 'in_progress',
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_date (user_id, session_date),
        INDEX idx_user_id (user_id),
        INDEX idx_session_date (session_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS memory_summary (
        id         VARCHAR(36) PRIMARY KEY,
        user_id    VARCHAR(36) NOT NULL UNIQUE,
        key_facts  JSON DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
]


def main():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            for ddl in TABLES:
                cur.execute(ddl)
                print(f"✓ {ddl.strip().split('(')[0].strip()}")
        conn.commit()
        print("\n所有表创建完成")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
