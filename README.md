# PitchIQ — Soccer Performance Analytics

> Track, analyze, and improve your game with data-driven insights.

A full-stack web application built for competitive youth soccer players (ages 14–22) to log match performance, visualize trends, generate insights, and set measurable goals.

---

## Screenshots

| Dashboard | Analytics | Matches |
|---|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Analytics](docs/screenshots/analytics.png) | ![Matches](docs/screenshots/matches.png) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Auth | Firebase Authentication (Google OAuth) |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL 15 |
| ORM/Query | node-postgres (pg) |
| Deployment | Vercel (frontend) + Railway/Render (backend) |

---

## Project Structure

```
soccer-analytics/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Card, Button, Badge, StatCard, ProgressBar
│   │   │   └── Layout.tsx      # Sidebar navigation shell
│   │   ├── hooks/
│   │   │   └── useAuth.tsx     # Firebase auth context
│   │   ├── lib/
│   │   │   ├── firebase.ts     # Firebase config
│   │   │   ├── mockData.ts     # Demo mode sample data
│   │   │   └── utils.ts        # Formatters, insight generator
│   │   ├── pages/
│   │   │   ├── Landing.tsx     # Marketing landing page
│   │   │   ├── Dashboard.tsx   # KPI cards + charts
│   │   │   ├── Matches.tsx     # Match log list + form
│   │   │   ├── Analytics.tsx   # Interactive charts
│   │   │   ├── Goals.tsx       # Goal tracking
│   │   │   └── Profile.tsx     # Player profile + radar
│   │   ├── types/index.ts      # TypeScript interfaces
│   │   └── App.tsx             # Router + auth guard
│   └── package.json
│
├── server/                     # Express API
│   └── src/
│       ├── db/index.ts         # pg Pool + query helper
│       ├── middleware/auth.ts  # Firebase Admin JWT verification
│       ├── routes/
│       │   ├── matches.ts      # CRUD for matches
│       │   ├── goals.ts        # CRUD for goals
│       │   └── analytics.ts    # Aggregation endpoints
│       └── index.ts            # App entry point
│
├── database/
│   ├── schema.sql              # Full PostgreSQL schema
│   └── seed.sql                # Sample data for demo user
│
└── product-docs/
    ├── prd.md                  # Product Requirements Document
    ├── user-personas.md        # 3 detailed user personas
    ├── pain-points.md          # 7 validated pain points
    ├── user-journey-map.md     # End-to-end journey map
    ├── success-metrics.md      # KPIs and instrumentation plan
    └── feature-prioritization.md  # MoSCoW framework
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Firebase project (for auth)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/soccer-analytics.git
cd soccer-analytics
```

### 2. Firebase setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Sign-in method → **Google**
4. Go to Project Settings → Your apps → Add web app
5. Copy the config values

### 3. Configure environment variables

**Client** — create `client/.env.local`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxx
```

**Server** — create `server/.env`:
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/pitchiq
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 4. Set up the database

```bash
# Create the database
createdb pitchiq

# Run the schema
psql pitchiq < database/schema.sql

# Seed sample data (optional)
psql pitchiq < database/seed.sql
```

### 5. Install and run

```bash
# Frontend (in /client)
cd client
npm install
npm run dev
# → http://localhost:5173

# Backend (in /server, separate terminal)
cd server
npm install
npm run dev
# → http://localhost:3001
```

### 6. Try Demo Mode

No Firebase setup required to explore the app. Click **"Explore Demo Dashboard"** on the landing page to load fully-seeded sample data.

---

## API Reference

### Authentication
All `/api/*` routes require `Authorization: Bearer <firebase_id_token>` header.

### Endpoints

```
GET    /api/matches              → List all matches (sorted by date)
POST   /api/matches              → Create new match
DELETE /api/matches/:id          → Delete match

GET    /api/goals                → List all goals
POST   /api/goals                → Create new goal
PATCH  /api/goals/:id/progress   → Update current value

GET    /api/analytics/season-stats    → Aggregated season totals
GET    /api/analytics/trends/:metric  → Time-series data for a metric
GET    /api/analytics/insights        → Auto-generated performance insights

GET    /health                   → Health check
```

---

## Deployment

### Frontend (Vercel)

```bash
cd client
npm run build
# Push to GitHub, import repo in vercel.com
# Set environment variables in Vercel dashboard
```

### Backend (Railway or Render)

1. Connect your GitHub repo
2. Set root directory to `/server`
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add all `server/.env` variables in the dashboard
6. Provision a PostgreSQL database and use the connection string

---

## Git Commit Convention

```
feat:     new feature
fix:      bug fix
ui:       styling / layout changes
db:       schema or seed changes
docs:     documentation
refactor: code improvement without behavior change
```

Example commits:
```
feat: add match logging form with 14 performance fields
ui: redesign KPI cards with trend indicators
db: add season_statistics aggregation table
feat: insights engine generates position-based analysis
fix: pass accuracy trend chart domain clamp to 0-100
```

---

## Product Documentation

See the `product-docs/` folder for the full PM artifact suite:

- [PRD](product-docs/prd.md) — Problem, goals, features, risks, success metrics
- [User Personas](product-docs/user-personas.md) — ECNL, high school, recreational player
- [Pain Points](product-docs/pain-points.md) — 7 validated problems with user quotes
- [User Journey Map](product-docs/user-journey-map.md) — Sign-up through advocacy
- [Success Metrics](product-docs/success-metrics.md) — North star, KPIs, instrumentation
- [Feature Prioritization](product-docs/feature-prioritization.md) — MoSCoW + decision rationale

---

## Key Design Decisions

**Why demo mode (no auth required)?**  
Conversion data consistently shows that forcing authentication before value delivery loses 60–70% of visitors. Demo mode lets a recruiter or coach see the product immediately.

**Why rule-based insights instead of AI?**  
The most impactful insights for youth players are deterministic: "sprint speed up X%", "you perform better in X position." Shipping rule-based insights in week 1 > waiting 2 months for a polished AI layer.

**Why PostgreSQL over Firestore?**  
SQL aggregations (GROUP BY, window functions, percentile calculations) are the core of an analytics product. Firestore requires complex client-side aggregation for anything beyond basic document reads.

**Why Recharts over D3?**  
Recharts is React-native, declarative, and ships in hours. D3 gives infinite customization but requires weeks of canvas/SVG work. At MVP, delivery speed > pixel perfection.

---

## License

MIT — free to use for educational and portfolio purposes.
