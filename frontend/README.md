# Scrizians - Enterprise Offshore Talent & Engineering Portal

A high-performance, unified Full-Stack Web Application built with **Next.js 14 (App Router)**, **TypeScript**, **React 18**, **CSS Modules**, and **MongoDB Atlas**.

Scrizians connects global technology clients (VP of Engineering, CTOs, Tech Leads) with vetted senior software engineering talent in India across staff augmentation, dedicated squads, and direct hiring models.

---

## 🚀 Key Features & Highlights

- **Unified Full-Stack Architecture**: Next.js 14 App Router combining responsive React UI components and backend REST API routes (`/api/*`).
- **Live MongoDB Atlas Integration**: Production database connectivity with automatic collection seeding and singleton connection pooling via Mongoose.
- **Real-Time Data Sync Engine**: Synchronous local storage caching paired with background event-driven synchronization (`scrizians_storage_updated`).
- **Role-Based Portals & Control Panels**:
  - **Super Admin Dashboard** (`/dashboard/admin`): Complete CRUD operations for Inbound Client Leads, Talent Roster, Job Openings, and Technical Insights with single-line data formatting and compact action controls.
  - **Client Portal** (`/dashboard/client`): Hiring requirement specs, shortlisted talent, interview calendar, active contracts, and downloadable PDF invoice billing statements (`Invoice_INV-2026-09_Scrizians.pdf`).
  - **Candidate Portal** (`/dashboard/candidate`): Profile verification, interactive PDF/Resume upload, job application tracking, and interview schedules.
  - **Contributor Portal** (`/dashboard/contributor`): Community article creation and editorial workflow.
- **Transactional Mailer Integration**: Configured SMTP mailer setup for client inquiry notifications.
- **Clean Responsive Design**: Tailored CSS Modules styling with zero UI layout jumping or infinite re-render loops.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 14.2.35 (App Router)
- **Language**: TypeScript 5.4+
- **Styling**: CSS Modules (`*.module.css`) + Lucide Icons
- **Database**: MongoDB Atlas (`scrizians` Database) via Mongoose 9.x
- **State & Sync**: React State + Browser LocalStorage + Event-driven EventBus
- **Deployment**: Vercel / Node.js Production Server

---

## 📁 Project Directory Structure

```text
scrizians-frontend/
├── docs/
│   └── PROJECT_METHODOLOGY.md  # Detailed technical guidelines & developer handbook
├── scripts/
│   ├── seed-atlas.js           # Initial database seeder script
│   ├── seed-10-items.js        # 10-item production sample dataset seeder
│   └── separate-databases.js   # Database migration and separation script
├── src/
│   ├── app/                    # Next.js App Router Pages & API Routes
│   │   ├── api/                # Backend API REST Endpoints
│   │   │   ├── insights/       # GET, POST, DELETE Insights API
│   │   │   ├── jobs/           # GET, POST, DELETE Jobs API
│   │   │   ├── leads/          # GET, POST, DELETE Client Leads API
│   │   │   └── talent/         # GET, POST, DELETE Talent Roster API
│   │   ├── dashboard/          # Portals (Admin, Client, Candidate, Contributor)
│   │   ├── hire-talent/        # Public Hire Talent CTA Page
│   │   ├── insights/           # Public Technical Articles & Hiring Guides
│   │   ├── jobs/               # Public Jobs Board
│   │   ├── talent/             # Public Talent Directory
│   │   └── layout.tsx          # Main Application Shell
│   ├── components/             # Reusable UI Components
│   ├── lib/                    # MongoDB Singleton Connection (mongodb.ts)
│   ├── models/                 # Mongoose Schemas (Lead, Talent, Job, Insight, SeedMarker)
│   └── utils/                  # Synchronized Data Engine (dataSync.ts)
├── .env.local                  # Environment Configuration Secrets (Git ignored)
├── .gitignore                  # Git Ignore Specifications
├── package.json                # Project Dependencies & Scripts
├── PROJECT_METHODOLOGY.md      # Full Architecture & Guidelines Document
└── README.md                   # Project Overview & Quick Start Guide
```

---

## 🔑 Environment Variables Setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SESSION_SECRET=seahawk_ship_management_secret_key_32chars_minimum!

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://gyanvendra_db:Ramayan%239026@cluster0.lmd3dvm.mongodb.net/scrizians?retryWrites=true&w=majority&appName=Cluster0

# SMTP Mailer Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=gyanvendram@gmail.com
SMTP_PASS=tetuognewzeqqghj
SMTP_FROM="Sea Hawk Maritime Portal" <gyanvendram@gmail.com>
```

---

## ⚡ Getting Started (Local Development)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Production Build & Verification**:
   ```bash
   npm run build
   ```

---

## 📚 Developer Documentation

For complete architectural guidelines, database schemas, sync engine mechanics, and onboarding instructions for future developers, read the **[PROJECT_METHODOLOGY.md](./PROJECT_METHODOLOGY.md)** handbook.
