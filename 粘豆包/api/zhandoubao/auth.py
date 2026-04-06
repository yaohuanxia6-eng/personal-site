import os
import sys
import jwt
import json
import urllib.request
from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")

security = HTTPBearer()


@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    """获取 Supabase JWKS 公钥（缓存）"""
    url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"[auth] Failed to fetch JWKS: {e}", file=sys.stderr, flush=True)
        return {"keys": []}


def _verify_with_jwks(token: str) -> dict:
    """用 JWKS 公钥验证 ES256 token"""
    jwks = _get_jwks()
    # 解析 token header 获取 kid
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    alg = header.get("alg", "ES256")

    for key_data in jwks.get("keys", []):
        if key_data.get("kid") == kid or kid is None:
            public_key = jwt.algorithms.ECAlgorithm.from_jwk(json.dumps(key_data))
            return jwt.decode(
                token,
                public_key,
                algorithms=[alg],
                options={"verify_aud": False},
            )
    raise jwt.InvalidTokenError("No matching key found in JWKS")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """验证 Supabase JWT token，返回 user_id (sub 字段)"""
    token = credentials.credentials
    try:
        # 先检查算法
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "")

        if alg.startswith("ES"):
            # ES256/ES384 — 用 JWKS 公钥验证
            payload = _verify_with_jwks(token)
        else:
            # HS256 — 用 JWT Secret 验证（向后兼容）
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256", "HS384", "HS512"],
                options={"verify_aud": False},
            )

        user_id: str = payload.get("sub", "")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的用户凭证")
        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已过期，请重新登录")
    except jwt.InvalidTokenError as e:
        print(f"[auth] JWT failed: {e}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的登录凭证")
