# Latestname · 此刻之名

> **I Ching × Tarot × Personality Archetypes — A deterministic divination engine with AI-powered interpretation.**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.templatika.io/)

---

## 🔮 What is Latestname?

Latestname is not your typical fortune-telling app. It's a **deterministic divination platform** that fuses Eastern and Western esoteric traditions into a unified resonance-reading system.

### The Core Innovation: **Cross-System Resonance**

When you ask a question, Latestname doesn't just give you one perspective. It simultaneously:

1. **Casts an I Ching hexagram** using the authentic Coin Method (金钱卦) — 6 lines, 3 coins each, with changing lines generating a transformed hexagram
2. **Draws Tarot cards** with Fisher-Yates shuffle, including upright/reversed positions
3. **Analyzes resonance** — when both systems point to the same theme (e.g., both suggest "breakthrough"), the interpretation is strengthened (cross-system corroboration)

**The result:** A unique name for this moment — your **Latest Name** (此刻之名).

### Three Pillars

| Pillar | What it does |
|--------|-------------|
| **64 Hexagrams** | Full I Ching system with changing lines, transformed hexagrams, relations (错/综/互), and 384 line texts |
| **78 Tarot Cards** | Complete Rider-Waite deck (22 Major + 56 Minor Arcana) with multiple spreads |
| **16 Archetypes** | A 4-dimensional personality system (Decisive/Judgment/Social/Attribution) with adaptive questioning — generates your "ground-color name" (底色之名) |

---

## ✨ Features

### For Users
- 🎴 **Dual-system divination** — I Ching + Tarot cast simultaneously, with resonance analysis
- 🧠 **Adaptive personality quiz** — 28 questions that adapt to your answers, mapping you to one of 16 archetypes
- 📜 **Personal history (卜辞)** — Cloud-synced divination records with mood tracking and fortune trends
- 🎯 **Daily hexagram** — A new hexagram for everyone each day (deterministic, based on date)
- 🌐 **Bilingual** — Full Chinese and English support
- 📱 **Responsive** — Works on mobile, tablet, and desktop

### For Administrators
- 👥 **User management** — Tier system (Standard / Pro / Admin) with per-feature quotas
- 🤖 **LLM configuration** — Connect GPT / Claude / GLM or any OpenAI-compatible API
- 📊 **Feedback management** — User feedback collection with status workflow
- ⚙️ **System configuration** — All settings via environment variables

---

## 🏗️ Architecture

```
latestname/
├── backend/                 # FastAPI + Python
│   ├── app/
│   │   ├── main.py          # API routes & divination orchestration
│   │   ├── divination.py    # Core engine: hexagrams, tarot, resonance
│   │   ├── bazi.py          # BaZi (八字) four-pillar calculation
│   │   ├── personality.py   # 16-archetype adaptive quiz engine
│   │   ├── auth.py          # JWT auth, user management, quotas
│   │   ├── geo.py           # City geolocation (3,645 cities, MIT data)
│   │   ├── naming.py        # Latest-name generation algorithm
│   │   └── _authorship.py   # Authorship integrity module
│   └── data/
│       ├── iching.json      # 64 hexagrams with full texts
│       ├── tarot.json       # 78 tarot cards with meanings
│       ├── personality_*.json  # 16 archetypes + adaptive questions
│       └── cities.json      # 3,645 cities with coordinates
│
├── frontend/                # React 18 + Vite + TypeScript
│   └── src/
│       ├── pages/           # Home, Divine, History, Admin, etc.
│       ├── components/      # HexagramSVG, TarotCard, ShareCard, etc.
│       ├── contexts/        # AuthContext with JWT management
│       └── i18n.ts          # Bilingual translations
│
└── docs/                    # Setup guides
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy, PyJWT, PyEphem (astronomical calculations) |
| Frontend | React 18, Vite, TypeScript, React Router |
| AI Interpretation | Any OpenAI-compatible LLM (GPT / Claude / GLM / etc.) |
| Database | SQLite (production-ready, swappable to PostgreSQL) |
| Auth | JWT with email + optional OAuth (Google / GitHub) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/linmy666/latestname.git
cd latestname

# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Backend environment variables
export ENABLE_AUTH=true
export JWT_SECRET=$(openssl rand -hex 32)

# Optional: Email service for verification
export RESEND_API_KEY=""

# Optional: OAuth providers
export GOOGLE_CLIENT_ID=""
export GOOGLE_CLIENT_SECRET=""
export GITHUB_CLIENT_ID=""
export GITHUB_CLIENT_SECRET=""
```

### 3. Initialize Database & Default Admin

```bash
cd backend
python3 -c "
from app.auth import engine, Base, SessionLocal, User, pwd_context
Base.metadata.create_all(engine)
db = SessionLocal()
if not db.query(User).filter(User.email == 'admin@latestname.com').first():
    admin = User(
        email='admin@latestname.com',
        name='Administrator',
        hashed_password=pwd_context.hash('changeme123'),
        is_active=True, is_superuser=True, is_verified=True, tier='admin'
    )
    db.add(admin)
    db.commit()
    print('✅ Default admin created: admin@latestname.com / changeme123')
else:
    print('Admin already exists')
db.close()
"
```

> ⚠️ **Change the default admin password immediately after first login!**

### 4. Run

```bash
# Terminal 1: Backend (port 8765)
cd backend
ENABLE_AUTH=true python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8765

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev
```

Open `http://localhost:5173` — you're ready to divine.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_AUTH` | No | `false` | Enable user authentication system |
| `JWT_SECRET` | Yes* | — | JWT signing secret (`openssl rand -hex 32`) |
| `JWT_EXPIRE_HOURS` | No | `168` | Token expiry in hours |
| `RESEND_API_KEY` | No | — | Resend API key for email |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth secret |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth secret |

*Required when `ENABLE_AUTH=true`

### LLM Configuration

LLM integration is configured via the **Admin Panel** (not environment variables):

1. Log in as admin
2. Navigate to **Admin → Settings**
3. Set Base URL, API Key, and Model name
4. Supported: Any OpenAI-compatible API (GPT, Claude, GLM, MiniMax, etc.)

### User Tiers

| Tier | History Retention | Deep Analysis | Personalized Insights |
|------|------------------|---------------|----------------------|
| Standard | 30 days | ✅ (limited) | ❌ |
| Pro | Unlimited | ✅ (extended) | ✅ |
| Admin | Unlimited | ✅ (unlimited) | ✅ |

---

## 🎴 How It Works

### The Divination Pipeline

```
User asks a question
        │
        ▼
   ┌─────────────┐
   │  Seed Generation  │ ← question + date + time + personality
   └──────┬──────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌───────┐  ┌───────┐
│ I Ching│  │ Tarot │     Simultaneous cast
│ Coin   │  │ Fisher│     (same seed = reproducible)
│ Method │  │-Yates │
└───┬───┘  └───┬───┘
    │          │
    └────┬─────┘
         ▼
  ┌──────────────┐
  │ Resonance Analysis│  17 theme mappings cross-check
  │ (共振分析)        │  both systems for corroboration
  └───────┬──────┘
          ▼
  ┌──────────────┐
  │ AI Interpretation│  LLM generates natural-language reading
  │ (optional)       │  powered by GPT / Claude / GLM
  └───────┬──────┘
          ▼
     Latest Name        A unique name for this moment
    (此刻之名)
```

### Reproducibility

The same person asking the same question during the same 2-hour period (地支时辰) will get the **same result** — this is by design, not a bug. The seed incorporates:

- Question text
- Current date
- Current Earthly Branch hour (子丑寅卯…)
- Optional user identifier

---

## 📜 License

**AGPL-3.0-or-later** — See [LICENSE](./LICENSE)

This means:
- ✅ You can self-host
- ✅ You can modify
- ✅ You can distribute
- ⚠️ **You MUST open-source your modifications** (even for network services)
- ⚠️ You MUST preserve attribution

### Third-Party Data

| Data | Source | License |
|------|--------|---------|
| City coordinates (3,645 cities) | [xiangyuecn/AreaCity-JsSpider-StatsGov](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov) | MIT |
| I Ching texts | Public domain + original compilation | CC0 |
| Tarot meanings | Public domain (Rider-Waite tradition) | CC0 |
| Personality imagery | AI-generated, post-processed | Project proprietary |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Contact

- **GitHub**: [linmy666/latestname](https://github.com/linmy666/latestname)
- **Issues**: [Report a bug](https://github.com/linmy666/latestname/issues)
- **Feedback**: Use the in-app feedback page

---

<div align="center">

**Latestname · 此刻之名**

*Every cast is a name. Every name is a moment.*

</div>
