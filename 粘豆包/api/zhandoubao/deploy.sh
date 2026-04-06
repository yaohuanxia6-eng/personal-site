#!/bin/bash
# 粘豆包后端一键部署脚本
# 用法: 在服务器上执行 bash deploy.sh

set -e
echo "═══════════════════════════════════════"
echo "  粘豆包后端部署脚本"
echo "═══════════════════════════════════════"

TARGET="/opt/api/zhandoubao"

# 1. 安装 Python 依赖
echo ""
echo "[1/4] 安装 Python 依赖..."
pip3 install aiomysql PyJWT cryptography openai pydantic python-dotenv sse-starlette httpx 2>/dev/null || pip install aiomysql PyJWT cryptography openai pydantic python-dotenv sse-starlette httpx

# 2. 创建 .env 文件（如果不存在）
echo ""
echo "[2/4] 检查 .env 配置..."
if [ ! -f "$TARGET/.env" ]; then
    cat > "$TARGET/.env" << 'ENVEOF'
# 数据库连接
DB_HOST=localhost
DB_USER=zdb_user
DB_PASSWORD=Zdb@2024Secure9
DB_NAME=zhandoubao

# Supabase JWT Secret（去 Supabase Dashboard → Settings → API → JWT Secret 复制）
SUPABASE_JWT_SECRET=请替换为你的Supabase JWT Secret

# AI 模型
KIMI_API_KEY=请替换为你的Kimi API Key
KIMI_BASE_URL=https://api.moonshot.cn/v1
AI_MODEL=moonshot-v1-8k
ENVEOF
    echo "  ⚠️  已创建 .env 文件，请编辑填入真实密钥："
    echo "  vim $TARGET/.env"
else
    echo "  ✓ .env 已存在"
fi

# 3. 执行建表
echo ""
echo "[3/4] 执行建表..."
cd "$TARGET"
python3 init_db.py

# 4. 重启服务
echo ""
echo "[4/4] 重启服务..."
systemctl restart zhandoubao
sleep 2

# 5. 验证
echo ""
echo "═══════════════════════════════════════"
echo "  验证服务状态"
echo "═══════════════════════════════════════"
systemctl is-active zhandoubao && echo "✓ 服务运行中" || echo "✗ 服务未启动，请检查日志: journalctl -u zhandoubao -n 50"

echo ""
echo "测试健康检查..."
curl -s http://127.0.0.1:8091/health 2>/dev/null && echo "" || echo "✗ 健康检查失败"

echo ""
echo "═══════════════════════════════════════"
echo "  部署完成！"
echo ""
echo "  ⚠️  重要：请编辑 .env 填入真实密钥"
echo "  vim $TARGET/.env"
echo ""
echo "  填完后重启: systemctl restart zhandoubao"
echo "  查看日志: journalctl -u zhandoubao -f"
echo "═══════════════════════════════════════"
