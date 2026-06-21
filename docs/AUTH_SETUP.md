# 认证系统部署指南

> 本文档介绍 Latestname 的认证系统配置方法。
> 基于 `fastapi-users` v15 + Resend 邮件服务。

---

## 一、环境变量

在 `/tmp/onyx_env.sh` 或 `.env` 中配置：

```bash
# === 基础 ===
ENABLE_AUTH=true              # 开启认证（false = 开源 guest 模式）
JWT_SECRET=你的随机密钥        # openssl rand -hex 32
FRONTEND_URL=http://localhost:5173   # 前端地址（OAuth/Magic Link 回调）

# === 管理员 ===
ADMIN_EMAIL=admin@latestname.com
ADMIN_PASSWORD=你的管理员密码

# === 邮件服务（Resend）===
# 开发环境：留空 → 邮件内容打印到终端（不发真邮件）
# 生产环境：去 https://resend.com 注册（免费 100 封/天）
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@latestname.com   # 域名需在 Resend 后台验证

# === OAuth（可选）===
# Google: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
# GitHub: https://github.com/settings/developers
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# === OAuth 回调地址（生产环境用）===
# OAUTH_REDIRECT_BASE=https://api.latestname.com
```

---

## 二、认证功能列表

| 功能 | 端点 | 说明 |
|------|------|------|
| 状态查询 | `GET /api/auth/status` | 返回认证是否开启 + 功能列表 |
| 注册 | `POST /api/auth/register` | 邮箱+密码，注册后自动发验证邮件 |
| 登录 | `POST /api/auth/login` | 邮箱+密码 |
| 当前用户 | `GET /api/auth/me` | 需要 Bearer token |
| 使用量 | `GET /api/auth/usage` | AI 剩余次数 |
| **Magic Link 请求** | `POST /api/auth/request-magic-link` | 输邮箱 → 收登录链接 |
| **Magic Link 验证** | `POST /api/auth/verify-magic-link` | 点击邮件链接，返回 JWT |
| **邮箱验证请求** | `POST /api/auth/resend-verification` | 重发验证邮件 |
| **邮箱验证** | `POST /api/auth/verify-email` | 验证邮箱 token |
| Google OAuth | `GET /api/auth/oauth/google` | 重定向到 Google |
| Google 回调 | `GET /api/auth/oauth/google/callback` | 返回 JWT |
| GitHub OAuth | `GET /api/auth/oauth/github` | 重定向到 GitHub |
| GitHub 回调 | `GET /api/auth/oauth/github/callback` | 返回 JWT |

---

## 三、Magic Link 登录流程

```
用户输入邮箱
    ↓
POST /api/auth/request-magic-link
    ↓
生成 token（30分钟有效）→ 存 magic_links 表
    ↓
发送邮件（Resend / 开发模式打印到终端）
    ↓
用户点击邮件中的链接
    ↓
前端 /login?magic_token=xxx
    ↓
POST /api/auth/verify-magic-link { token }
    ↓
验证 token → 返回 JWT → 自动登录
```

---

## 四、首次部署

```bash
# 1. 安装依赖
cd backend
pip install -r requirements.txt

# 2. 数据迁移（如果从旧版升级）
python3 scripts/migrate_auth.py
# 备份在 data/auth.db.bak

# 3. 配置环境变量
cp /tmp/onyx_env.sh.example /tmp/onyx_env.sh
vim /tmp/onyx_env.sh

# 4. 启动
source /tmp/onyx_env.sh
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8765

# 5. 验证
curl http://localhost:8765/api/auth/status
curl -X POST http://localhost:8765/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@latestname.com","password":"你的密码"}'
```

---

## 五、Resend 邮件配置

### 开发环境
不设置 `RESEND_API_KEY` → 邮件内容打印到终端，方便调试。

### 生产环境
1. 注册 https://resend.com（免费 100 封/天）
2. 在 Resend 后台添加你的域名（如 `latestname.com`）
3. 添加 DNS 记录（SPF / DKIM）
4. 获取 API Key → 设置 `RESEND_API_KEY=re_xxx`
5. 设置 `RESEND_FROM_EMAIL=noreply@latestname.com`

---

## 六、数据库结构

### users 表
```sql
id              INTEGER PRIMARY KEY
email           VARCHAR(320) UNIQUE
hashed_password VARCHAR(320)     -- bcrypt 哈希，OAuth 用户为 NULL
is_active       BOOLEAN DEFAULT 1
is_superuser    BOOLEAN DEFAULT 0  -- 管理员
is_verified     BOOLEAN DEFAULT 0  -- 邮箱验证
name            VARCHAR(100)
avatar_url      TEXT
oauth_provider  VARCHAR(20)       -- 兼容旧数据
oauth_id        VARCHAR(255)
created_at      TIMESTAMP
```

### magic_links 表
```sql
id          INTEGER PRIMARY KEY
token       VARCHAR(64) UNIQUE
email       VARCHAR(320)
purpose     VARCHAR(20)   -- login / verify / reset
expires_at  TIMESTAMP
used        BOOLEAN DEFAULT 0
created_at  TIMESTAMP
```

### oauth_accounts 表
```sql
id            INTEGER PRIMARY KEY
user_id       INTEGER REFERENCES users(id)
oauth_name    VARCHAR(10)    -- google / github
access_token  VARCHAR(1024)
account_id    VARCHAR(255)
account_email VARCHAR(320)
expires_at    INTEGER
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

---

## 七、回滚

如果迁移后出问题：

```bash
# 恢复数据库
cp data/auth.db.bak data/auth.db

# 恢复代码
git checkout app/auth.py app/email.py
```

---

## 八、安全注意事项

1. **JWT_SECRET** — 生产环境务必用 `openssl rand -hex 32` 生成
2. **HTTPS** — 生产环境必须用 HTTPS，否则 token 可被中间人截获
3. **CORS** — 后端已配置 `allow_origins`，生产环境只允许你的域名
4. **Rate Limiting** — Magic Link 请求应加速率限制（当前未实现，建议用 slowapi）
5. **密码策略** — 最少 8 位（前端验证），建议后端也加验证
