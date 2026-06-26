<div align="center">

# CodeHire

### AI-Powered Technical Hiring Platform

**Assess candidates with real coding challenges · AI-graded evaluations · Smart pipeline automation**

[![Built with](https://img.shields.io/badge/Built_with-MERN_Stack-4F46E5?style=flat-square)](#tech-stack)
[![AI](https://img.shields.io/badge/AI-Gemini_2.0_Flash-059669?style=flat-square)](#ai-assessment-system)
[![Editor](https://img.shields.io/badge/Editor-Monaco_(VS_Code)-1D4ED8?style=flat-square)](#online-code-assessments)
[![License](https://img.shields.io/badge/License-MIT-94A3B8?style=flat-square)](#license)

</div>

---

## ✨ Overview

CodeHire is a full-stack hiring platform that lets recruiters create coding assessments, send them to candidates via unique links, and get AI-powered evaluations — all with built-in anti-cheat monitoring and pipeline automation.

**Key Differentiators:**
- 🧠 **AI Code Evaluation** — Gemini analyzes code for correctness, quality, efficiency, and originality
- 💻 **Online Code Editor** — Candidates code in a full Monaco editor (VS Code engine) in the browser
- 🛡️ **Anti-Cheat System** — Tracks tab switches, paste events, typing speed, and idle time
- ⚡ **Pipeline Automation** — Rules engine that auto-moves candidates based on scores
- 📊 **Smart Comparison** — Side-by-side candidate comparison with AI recommendations

---

## 🎯 Features

### Core Platform
- **JWT Authentication** — Register, login, protected routes, role-based access
- **Candidate Pipeline** — 6-stage Kanban board (Screen → Assess → Interview → Offer → Hired / Rejected)
- **Dashboard** — Filterable, sortable candidate table with pagination, bulk actions, and CSV export
- **Candidate Profiles** — Detailed view with notes, tags, resume upload/download, interview scheduling
- **Real-time Notifications** — Bell icon with unread count for pipeline events

### Online Code Assessments
- **Assessment Builder** — Create coding challenges with multiple problems, test cases, and difficulty levels
- **Monaco Code Editor** — Full VS Code editing experience with syntax highlighting and autocompletion
- **Client-side Test Runner** — Runs code safely in a Web Worker sandbox (no server execution needed)
- **Unique Assessment Links** — Send candidates a link — no login required, 7-day expiry
- **Timed Assessments** — Configurable time limits with auto-submit on expiry

### AI Assessment System
- **Gemini 2.0 Flash Integration** — Evaluates submissions on 4 axes:
  - **Correctness** (40%) — Test pass rate and logical soundness
  - **Code Quality** (20%) — Naming, structure, readability, best practices
  - **Efficiency** (20%) — Time/space complexity analysis
  - **Originality** (20%) — Detects AI-generated or copy-pasted code
- **Detailed Feedback** — AI writes 2-3 paragraph specific feedback per submission
- **Auto Score Update** — Candidate pipeline score updates automatically after evaluation

### Anti-Cheat Monitoring
- **Tab Switch Detection** — Counts `visibilitychange` events
- **Paste Event Tracking** — Monitors clipboard paste frequency
- **Copy Event Tracking** — Tracks copy attempts
- **Typing Speed Analysis** — Chars/minute average for anomaly detection
- **Idle Time Detection** — Flags 30s+ inactivity periods
- **Full Report** — All metrics visible in the Submission Review page

### Pipeline Automation
- **Visual Rule Builder** — IF [trigger] WHEN [condition] THEN [action]
- **Triggers** — Assessment completed, score above/below threshold, stage change
- **Actions** — Auto-move to stage, add tag, send email
- **Toggle Controls** — Enable/disable rules individually
- **Execution Counter** — Track how many times each rule has fired

### Candidate Comparison
- **Side-by-Side View** — Compare 2-4 candidates in a structured table
- **Radar Charts** — SVG-based score visualization across assessment categories
- **AI Recommendation** — Gemini generates hiring advice with reasoning

### Analytics & Reporting
- **Pipeline Conversion Funnel** — Visual stage-by-stage flow
- **Score Distribution** — Bar chart across 5 score ranges
- **Stage Breakdown** — Proportional bars per pipeline stage
- **Top Technologies** — Stack frequency analysis
- **Summary Stats** — Total candidates, avg score, pipeline count, hire rate

### Additional Features
- **Resume Upload/Download** — Multer-powered file management
- **Interview Scheduling** — Date picker with email notifications
- **Email Notifications** — Nodemailer with HTML templates (Ethereal test transport)
- **Dark Mode** — Full dark theme with toggle
- **Responsive Design** — Mobile-first with drawer navigation
- **Seed Data** — Pre-built demo data for quick testing

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router 6 |
| **Code Editor** | Monaco Editor (VS Code engine) |
| **Styling** | Vanilla CSS with design tokens |
| **Backend** | Node.js, Express 4 |
| **Database** | MongoDB with Mongoose 8 |
| **AI** | Google Gemini 2.0 Flash |
| **Auth** | JWT (jsonwebtoken + bcryptjs) |
| **File Upload** | Multer |
| **Email** | Nodemailer (Ethereal dev transport) |
| **Security** | Helmet, express-rate-limit, CORS |

---

## 📁 Project Structure

```
codehire-mern/
├── server/                          ← Express + MongoDB API
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification
│   ├── models/
│   │   ├── User.js                  # User accounts (founder/recruiter/admin)
│   │   ├── Candidate.js             # Candidate profiles
│   │   ├── Application.js           # Beta waitlist
│   │   ├── Note.js                  # Candidate notes
│   │   ├── Notification.js          # In-app notifications
│   │   ├── Assessment.js            # Coding assessments + problems
│   │   ├── Submission.js            # Assessment submissions + AI scores
│   │   └── AutomationRule.js        # Pipeline automation rules
│   ├── routes/
│   │   ├── authRoutes.js            # Auth + profile
│   │   ├── candidateRoutes.js       # Candidate CRUD + resume + interviews
│   │   ├── noteRoutes.js            # Candidate notes
│   │   ├── notificationRoutes.js    # Notification endpoints
│   │   ├── applicationRoutes.js     # Beta applications
│   │   ├── assessmentRoutes.js      # Assessment CRUD + send links
│   │   ├── submissionRoutes.js      # Public + protected submission endpoints
│   │   ├── automationRoutes.js      # Automation rule CRUD
│   │   └── compareRoutes.js         # Candidate comparison + AI
│   ├── utils/
│   │   ├── email.js                 # Nodemailer + HTML templates
│   │   └── gemini.js                # Gemini AI evaluation + comparison
│   ├── server.js                    # App entry point
│   ├── seed.js                      # Demo data seeder
│   └── .env.example                 # Environment variables template
│
└── client/                          ← Vite + React SPA
    └── src/
        ├── api/axios.js             # Axios instance with auth interceptor
        ├── context/
        │   ├── AuthContext.jsx       # Auth state + JWT management
        │   └── ThemeContext.jsx      # Dark/light theme toggle
        ├── components/
        │   ├── Navbar.jsx            # Navigation + mobile drawer
        │   ├── Footer.jsx            # Site footer
        │   ├── KanbanBoard.jsx       # Drag-and-drop pipeline board
        │   ├── NotificationBell.jsx  # Real-time notification bell
        │   ├── ProtectedRoute.jsx    # Auth guard HOC
        │   └── FadeUp.jsx            # Scroll animation wrapper
        ├── pages/
        │   ├── Home.jsx              # Landing page (hero + features + CTA)
        │   ├── Login.jsx             # Login form
        │   ├── Register.jsx          # Registration form
        │   ├── Apply.jsx             # Beta access application
        │   ├── Demo.jsx              # Interactive demo showcase
        │   ├── Dashboard.jsx         # Candidate table + stats + Kanban
        │   ├── CandidateProfile.jsx  # Detailed candidate view
        │   ├── Analytics.jsx         # Pipeline analytics charts
        │   ├── Settings.jsx          # Profile + password + automation rules
        │   ├── Assessments.jsx       # Assessment list + create
        │   ├── AssessmentBuilder.jsx # Problem editor + test cases + send
        │   ├── CandidateAssessment.jsx # Public coding portal (Monaco)
        │   ├── SubmissionReview.jsx  # AI report + radar chart + anti-cheat
        │   ├── Compare.jsx           # Side-by-side comparison
        │   └── NotFound.jsx          # 404 page
        ├── workers/
        │   └── codeRunner.worker.js  # Sandboxed code execution
        ├── hooks/usePageTitle.js     # Dynamic page titles
        ├── data/homeData.js          # Landing page content
        ├── App.jsx                   # Router + layout
        ├── index.css                 # Complete design system (~2100 lines)
        └── main.jsx                  # React entry point
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally or a MongoDB Atlas URI
- **Gemini API Key** (optional — for AI evaluation features)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/codehire-mern.git
cd codehire-mern
```

### 2. Backend Setup

```bash
cd server
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/codehire
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key    # Optional
```

```bash
npm install
npm run seed       # (Optional) Seed demo data
npm run dev        # Starts API → http://localhost:5000
```

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev        # Starts UI → http://localhost:5173
```

### 4. Open in Browser

Navigate to `http://localhost:5173` — Register an account and start hiring!

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Login & get JWT |
| `GET` | `/api/auth/me` | ✅ | Current user |
| `PUT` | `/api/auth/profile` | ✅ | Update profile |
| `PUT` | `/api/auth/password` | ✅ | Change password |

### Candidates
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/candidates` | ✅ | List (paginated, filterable) |
| `POST` | `/api/candidates` | ✅ | Add candidate |
| `PATCH` | `/api/candidates/:id` | ✅ | Update candidate |
| `DELETE` | `/api/candidates/:id` | ✅ | Remove candidate |
| `POST` | `/api/candidates/:id/resume` | ✅ | Upload resume |
| `DELETE` | `/api/candidates/:id/resume` | ✅ | Delete resume |
| `POST` | `/api/candidates/:id/schedule-interview` | ✅ | Schedule interview |

### Assessments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/assessments` | ✅ | List assessments |
| `POST` | `/api/assessments` | ✅ | Create assessment |
| `GET` | `/api/assessments/:id` | ✅ | Get with submissions |
| `PUT` | `/api/assessments/:id` | ✅ | Update assessment |
| `DELETE` | `/api/assessments/:id` | ✅ | Delete assessment |
| `POST` | `/api/assessments/:id/send` | ✅ | Generate candidate link |

### Submissions (Public — Candidate)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/assess/:token` | — | Load assessment |
| `POST` | `/api/assess/:token/start` | — | Start timer |
| `POST` | `/api/assess/:token/submit` | — | Submit code + anti-cheat |

### Submissions (Protected — Recruiter)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/submissions` | ✅ | List all submissions |
| `GET` | `/api/submissions/:id` | ✅ | Detailed submission + AI report |

### Automation
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/automations` | ✅ | List rules |
| `POST` | `/api/automations` | ✅ | Create rule |
| `PUT` | `/api/automations/:id` | ✅ | Update rule |
| `DELETE` | `/api/automations/:id` | ✅ | Delete rule |

### Compare
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/compare` | ✅ | Compare candidates + AI summary |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/applications` | — | Submit beta request |
| `GET` | `/api/notifications` | ✅ | List notifications |
| `GET` | `/api/health` | — | API health check |

---

## 🗺️ Pages & Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/` | Home | — | Landing page with hero, features, CTA |
| `/login` | Login | — | Authentication |
| `/register` | Register | — | Account creation |
| `/apply` | Apply | — | Beta access application |
| `/demo` | Demo | — | Interactive feature showcase |
| `/assess/:token` | Assessment | — | Candidate coding portal (no nav) |
| `/dashboard` | Dashboard | ✅ | Candidate table, stats, Kanban |
| `/dashboard/candidates/:id` | Profile | ✅ | Candidate detail view |
| `/dashboard/analytics` | Analytics | ✅ | Pipeline charts & metrics |
| `/dashboard/assessments` | Assessments | ✅ | Assessment management |
| `/dashboard/assessments/:id` | Builder | ✅ | Problem & test case editor |
| `/dashboard/submissions/:id` | Review | ✅ | AI report & anti-cheat data |
| `/dashboard/compare` | Compare | ✅ | Side-by-side comparison |
| `/settings` | Settings | ✅ | Profile, password, automation rules |

---

## 🎨 Design System

**Theme: Professional Indigo/Slate**

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--paper` | `#F8FAFC` | `#0F172A` | Page background |
| `--surface` | `#FFFFFF` | `#1E293B` | Card backgrounds |
| `--ink` | `#0F172A` | `#F1F5F9` | Primary text |
| `--rust` | `#4F46E5` | `#818CF8` | Primary accent (indigo) |
| `--sage` | `#059669` | `#34D399` | Success states |
| `--danger` | `#DC2626` | `#F87171` | Error / rejection |
| `--gold` | `#D97706` | `#FBBF24` | Warnings / amber |

| Font | Family | Usage |
|------|--------|-------|
| Display | Fraunces (serif) | Headings |
| Body | Inter | UI text |
| Mono | Space Mono | Code, metrics, labels |

---

## 🔒 Security

- **Helmet** — HTTP security headers
- **Rate Limiting** — 20 requests/15min on auth routes
- **JWT** — Stateless authentication with Bearer tokens
- **Password Hashing** — bcrypt with 10 salt rounds
- **CORS** — Configured origin whitelist
- **Input Validation** — express-validator on all inputs
- **File Validation** — Multer with type + size limits
- **Owner Isolation** — All queries scoped to authenticated user

---

## 🤖 AI Assessment Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Recruiter   │────→│  Creates     │────→│  Generates      │
│  Dashboard   │     │  Assessment  │     │  Unique Link    │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                                   ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Pipeline    │←────│  AI Scores   │←────│  Candidate      │
│  Updated     │     │  Generated   │     │  Codes & Submit │
└─────────────┘     └──────────────┘     └─────────────────┘
       │
       ▼
┌─────────────┐
│  Automation  │
│  Rules Fire  │
└─────────────┘
```

---

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL for CORS |
| `GEMINI_API_KEY` | No | — | Google Gemini API key for AI features |
| `SMTP_HOST` | No | — | SMTP host (uses Ethereal if not set) |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `EMAIL_FROM` | No | `CodeHire <noreply@codehire.dev>` | Sender address |

---

## 🧪 Scripts

### Server
```bash
npm run dev        # Start with nodemon (hot reload)
npm start          # Production start
npm run seed       # Seed demo candidates
```

### Client
```bash
npm run dev        # Vite dev server (HMR)
npm run build      # Production build
npm run preview    # Preview production build
```

---

## 📄 License

MIT — free for personal and commercial use.

---

<div align="center">

**Built with ❤️ using MERN + Gemini AI**

</div>
