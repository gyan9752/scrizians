# Scrizians Developer Handbook & Architecture Methodology Guidelines

This document serves as the authoritative developer guide, architectural blueprint, and engineering methodology reference for the **Scrizians** platform. Any future developer or contributor working on this repository should read and follow these guidelines.

---

## 🏛️ 1. Application Architecture Overview

Scrizians is designed as a **Unified Monolithic Full-Stack Application** using **Next.js 14 App Router**. 

### Key Architectural Pillars:
1. **Zero External Backend Overhead**: The Next.js App Router serves both the frontend UI routes and backend API routes in a single unified codebase.
2. **State & Offline Caching Pattern**:
   - Primary source of truth is **MongoDB Atlas** (`scrizians` Database).
   - Fast client UI loading is powered by Browser `localStorage`.
   - Asynchronous background synchronization keeps local storage in sync with MongoDB without blocking UI interactions.
3. **Decoupled API Routing**:
   - `/api/leads`: Inbound client inquiries and CRM pipeline management.
   - `/api/talent`: Scrizian developer profiles, hourly rates, and skills.
   - `/api/jobs`: Client job postings and applicant metrics.
   - `/api/insights`: Published technical guides and hiring articles.

---

## 🔄 2. Data Synchronization Engine (`src/utils/dataSync.ts`)

To prevent infinite re-rendering loops and excessive server load:

### Rules for Data Fetching:
- **`getStoredData(key, fallback)`**: Strictly reads data from `localStorage` synchronously. It **must NEVER** trigger HTTP requests directly inside the function.
- **`syncFromMongoDB(key)`**: Makes an HTTP GET request to `/api/*`. It compares `JSON.stringify(resData.data)` with `localStorage.getItem(key)`. The custom window event `scrizians_storage_updated` is **ONLY** dispatched if `newData !== oldData`.
- **`syncAllFromMongoDB()`**: Triggered ONCE during `useEffect` component mounting on main pages.

```text
[MongoDB Atlas] ◄── GET /api/* ── [syncFromMongoDB()]
       │                                   │
  Data Updated?                      Reads & Compares
       │                                   │
      YES ──► Updates localStorage ──► Dispatches ('scrizians_storage_updated')
       │                                   │
       NO  ──► No Event Dispatched ──► Zero Re-renders (Loop Prevented)
```

---

## 🗄️ 3. Database Schema Definitions (`src/models/`)

All database models use Mongoose with explicit TypeScript interfaces and `{ timestamps: false }` to avoid schema type mismatch during seed operations.

### A. Lead Model (`src/models/Lead.ts`)
```typescript
export interface ILead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  serviceRequested?: string;
  scrizianIdReferenced?: string;
  stage?: string;
  message?: string;
  createdAt?: string;
}
```

### B. Talent Model (`src/models/Talent.ts`)
```typescript
export interface ITalent {
  id: string;
  scrizianId: string;
  displayName: string;
  title: string;
  category?: string;
  summary?: string;
  experienceYears?: number;
  skills?: any;
  availability?: string;
  hourlyRateUSD?: number;
  monthlyRateINR?: number;
  relationshipBadge?: string;
  avatarText?: string;
  avatarUrl?: string;
  status?: string;
}
```

### C. Job Model (`src/models/Job.ts`)
```typescript
export interface IJob {
  id: string;
  slug?: string;
  dept?: string;
  typeBadge?: string;
  typeKey?: string;
  title: string;
  company?: string;
  companyLogoUrl?: string;
  location?: string;
  experience?: string;
  skills?: any;
  salaryUSD?: string;
  salaryINR?: string;
  rate?: string;
  status?: string;
  applicantsCount?: number;
}
```

### D. Insight Model (`src/models/Insight.ts`)
```typescript
export interface IInsight {
  id: string;
  cat?: string;
  category?: string;
  filterKey?: string;
  title: string;
  excerpt?: string;
  meta?: string;
  author?: string;
  publishedDate?: string;
  readTime?: string;
  coverImageUrl?: string;
  image?: string;
  status?: string;
}
```

### E. SeedMarker Model (`src/models/SeedMarker.ts`)
Tracks initial database seeding so deleted records are never automatically re-seeded back into MongoDB Atlas on page refresh.

---

## 🎨 4. UI & Design System Guidelines

1. **Dashboard Action Buttons**:
   - Table action buttons use compact icon-only buttons:
     - `👁️` View Details (`.btnActionView`)
     - `✏️` Edit Entity (`.btnActionEdit`)
     - `🗑️` Delete Entity (`.btnActionDelete`)
2. **Text & Table Formatting**:
   - All dates, categories, verification badges, and statuses must maintain single-line layout (`white-space: nowrap`).
   - Badges and statuses should be displayed as clean plain text without overwhelming colored pill backgrounds.

---

## 🚀 5. How to Deploy to Production (Vercel & GitHub)

### Step 1: Push Repository to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Scrizians Fullstack App"
git branch -M main
git remote add origin https://github.com/gyanvendra-web/scrizians.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Log in to [Vercel.com](https://vercel.com) using GitHub.
2. Click **Import Project** and select `scrizians`.
3. Add environment variables in Vercel settings:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
4. Click **Deploy**.

---

## 🛡️ 6. Guidelines for Future Developers

1. **Do NOT remove `.env.local` from `.gitignore`**: Secret API credentials must never be committed to source control.
2. **Do NOT call `syncFromMongoDB` inside getters**: Always keep synchronous getter functions decoupled from network side-effects.
3. **Always run `npm run build` locally before pushing code**: Ensure TypeScript types and lint checks compile with 0 errors.
