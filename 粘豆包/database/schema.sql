-- ============================================================
-- 粘豆包 - 工具箱功能表结构
-- 已有表: user_profiles, sessions, memory_summary
-- ============================================================

-- MBTI 偏好
CREATE TABLE IF NOT EXISTS user_mbti (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  ei CHAR(1) DEFAULT NULL COMMENT 'E or I',
  sn CHAR(1) DEFAULT NULL COMMENT 'S or N',
  tf CHAR(1) DEFAULT NULL COMMENT 'T or F',
  jp CHAR(1) DEFAULT NULL COMMENT 'J or P',
  mbti_type VARCHAR(4) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 日记条目
CREATE TABLE IF NOT EXISTS diary_entries (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  mode ENUM('guided', 'free') DEFAULT 'guided',
  event TEXT DEFAULT NULL COMMENT '发生了什么',
  body_reaction TEXT DEFAULT NULL COMMENT '身体反应',
  thought TEXT DEFAULT NULL COMMENT '脑海里想的',
  self_talk TEXT DEFAULT NULL COMMENT '对自己说',
  free_text TEXT DEFAULT NULL COMMENT '自由书写内容',
  mood VARCHAR(10) DEFAULT NULL COMMENT '心情名称',
  mood_emoji VARCHAR(10) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 安全计划
CREATE TABLE IF NOT EXISTS safety_plans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  signals TEXT DEFAULT NULL COMMENT '危机信号',
  self_help TEXT DEFAULT NULL COMMENT '自我帮助',
  contacts TEXT DEFAULT NULL COMMENT '联系人',
  meaning TEXT DEFAULT NULL COMMENT '活着的意义',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 感恩记录
CREATE TABLE IF NOT EXISTS gratitude_entries (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  items JSON NOT NULL COMMENT '好事列表',
  day_number INT DEFAULT 1 COMMENT '第几天',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CBT 认知行为记录
CREATE TABLE IF NOT EXISTS cbt_records (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  thought TEXT NOT NULL COMMENT '让你难受的想法',
  score_before INT DEFAULT 5 COMMENT '难受程度(前)',
  evidence TEXT DEFAULT NULL COMMENT '支持证据',
  counter_evidence TEXT DEFAULT NULL COMMENT '反对证据',
  friend_advice TEXT DEFAULT NULL COMMENT '对朋友会说',
  reframe TEXT NOT NULL COMMENT '重新看待',
  score_after INT DEFAULT NULL COMMENT '难受程度(后)',
  observation TEXT DEFAULT NULL COMMENT 'AI观察',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 情绪每日记录
CREATE TABLE IF NOT EXISTS emotion_records (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  emotion VARCHAR(10) NOT NULL COMMENT '主情绪',
  sub_emotion VARCHAR(20) DEFAULT NULL COMMENT '细分情绪',
  score DECIMAL(2,1) DEFAULT NULL COMMENT '情绪分数1-5',
  note TEXT DEFAULT NULL,
  record_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_date (user_id, record_date),
  INDEX idx_user_date (user_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 接地练习记录
CREATE TABLE IF NOT EXISTS grounding_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  steps_data JSON DEFAULT NULL COMMENT '5步填写内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
