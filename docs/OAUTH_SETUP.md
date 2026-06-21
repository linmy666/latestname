# OAuth 配置指南 — Google & GitHub 第三方登录

> 本项目的 OAuth 代码已经全部写好，只需要在 Google/GitHub 注册 App 拿到 Client ID 和 Secret 即可。

---

## 一、GitHub OAuth（5分钟搞定）

GitHub OAuth 最简单，因为不需要审核，注册即用。

### 步骤

1. 打开 https://github.com/settings/developers
2. 点击 **New OAuth App**
3. 填写：

| 字段 | 填什么 |
|------|--------|
| Application name | `Latestname` |
| Homepage URL | `https://latestname.com`（开发期填 `http://localhost:5173`） |
| Authorization callback URL | `https://latestname.com/api/auth/oauth/github/callback` |

4. 创建后拿到 **Client ID**（直接显示）
5. 点击 **Generate a new client secret** → 拿到 **Client Secret**

### 配置到项目

在 Vercel 后端环境变量（或本地 `/tmp/onyx_env.sh`）：

```bash
GITHUB_CLIENT_ID=Ov23lixxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**搞定！** GitHub 按钮立即可用。

---

## 二、Google OAuth（稍复杂，需审核）

Google 需要在 Google Cloud Console 创建项目，审核期约 1-4 周（个人项目通常几天）。

### 步骤

1. 打开 https://console.cloud.google.com/
2. 创建新项目 → 名称 `Latestname`
3. 左侧菜单 → **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth client ID**
   - 如果提示需要先配置 consent screen，按提示走一遍
   - User Type 选 **External**
   - 填应用名、你的邮箱、开发者邮箱
5. OAuth Client 配置：

| 字段 | 填什么 |
|------|--------|
| Application type | Web application |
| Authorized JavaScript origins | `https://latestname.com`（开发期加 `http://localhost:5173`） |
| Authorized redirect URIs | `https://latestname.com/api/auth/oauth/google/callback`（开发期加 `http://localhost:8765/api/auth/oauth/google/callback`） |

6. 创建后拿到 **Client ID** + **Client Secret**

### 配置到项目

```bash
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxx
```

### ⚠ 开发期间题

开发环境前端在 `:5173`，后端在 `:8765`。Google redirect URI 需要加两个：
- `http://localhost:8765/api/auth/oauth/google/callback`（后端回调）
- `http://localhost:5173/login`（前端接收 token 重定向）

---

## 三、完整环境变量（Vercel / Railway 部署）

```bash
# 认证开关
ENABLE_AUTH=true
JWT_SECRET=你的随机密钥（用 openssl rand -hex 32 生成）

# 管理员
ADMIN_EMAIL=admin@latestname.com
ADMIN_PASSWORD=你的管理员密码

# OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GITHUB_CLIENT_ID=Ov23lixxx
GITHUB_CLIENT_SECRET=xxx

# 前端地址
FRONTEND_URL=https://latestname.com

# OAuth 回调基地址（生产环境用域名）
OAUTH_REDIRECT_BASE=https://latestname.com
```

---

## 四、替代方案：开源 OAuth 库

如果你不想手动写 OAuth 逻辑（虽然本项目已经写好了），以下是常用方案：

### 方案 A：Authentik / Authelia（自建，免费）
- 完整的身份管理系统，支持 Google/GitHub/Microsoft 等
- Docker 部署，但比较重
- 适合：完全自托管、不想依赖第三方

### 方案 B：Supabase Auth（推荐，免费额度大）
- Postgres + Auth 一体化，免费 50,000 MAU
- 内置 Google/GitHub/Apple 等 20+ provider
- 只需在 Supabase 后台点几下配好 provider
- 前端用 `@supabase/supabase-js`，几行代码搞定
- https://supabase.com/docs/guides/auth

### 方案 C：Clerk（SaaS，有免费额度）
- 最精美的 Auth UI 组件库
- 免费 10,000 MAU
- React 组件直接嵌入，零代码写登录页
- https://clerk.com

### 方案 D：NextAuth.js / Auth.js
- 如果你迁移到 Next.js，这是标配
- 内置 80+ OAuth provider
- 但本项目是 React + Vite，不直接适用

---

## 五、本项目推荐路线

**最快路径（推荐）：**

1. **先注册 GitHub OAuth**（5分钟），测试 GitHub 登录
2. **Google OAuth 同步申请**（等待审核期间 GitHub 已能用）
3. 邮箱密码注册本身已实现，不依赖任何外部服务
4. 部署到 Vercel 后再配正式域名的 redirect URI

**本项目代码已 100% 支持 OAuth 全流程，无需引入额外库。**

---

## 六、开发环境测试 OAuth

开发环境因为前后端不同端口，OAuth 流程略有不同：

```
用户点 GitHub 登录
  → 前端 window.location.href = '/api/auth/oauth/github'
  → vite proxy 转发到 http://localhost:8765/api/auth/oauth/github
  → 后端 302 重定向到 GitHub 授权页
  → 用户授权
  → GitHub 回调到 http://localhost:8765/api/auth/oauth/github/callback?code=xxx
  → 后端拿 code 换 token → 创建/查找用户 → 生成 JWT
  → 302 重定向到 http://localhost:5173/login?token=xxx（FRONTEND_URL）
  → 前端 Login 页读 URL token → login(token) → 跳转首页/管理后台
```

开发环境需要设置：
```bash
export FRONTEND_URL=http://localhost:5173
```

GitHub OAuth App 的 callback URL 填：
```
http://localhost:8765/api/auth/oauth/github/callback
```
