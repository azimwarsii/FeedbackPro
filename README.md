FeedbackPro
===========

FeedbackPro is a modern feedback and survey management dashboard built with **Next.js 15**, **React 19**, **Tailwind CSS**, and **NextAuth**. It lets you create campaigns, collect responses, analyze feedback, and manage customers and rewards from a single interface.

### Features

- **Authentication**
  - Email/password auth flows using `next-auth`
  - Protected and unprotected routes (`(protected)` and `(unprotected)` app routes)

- **Campaign Management**
  - Create and edit feedback campaigns
  - Public feedback pages per campaign (`/feedback/[campaignId]`)
  - Overview of active and past campaigns

- **Surveys & Responses**
  - Survey builder UI for composing questions
  - Survey analytics dashboards (completion, response rate, etc.)
  - Response store and visualizations using charts

- **Customers & Wallet**
  - Customers list and basic customer details
  - Wallet dashboard for tracking rewards / payouts

- **Analytics Dashboard**
  - Overview panels and charts (ApexCharts, FullCalendar, etc.)
  - KPIs widgets, recent campaigns, and quick actions

- **Settings**
  - Profile information, security/privacy, notifications, and billing cards

- **UI & Experience**
  - Tailwind-based responsive layout
  - Dark/light theme toggle
  - Reusable UI components (buttons, dropdowns, modals, alerts, etc.)

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS
- **Auth**: NextAuth (`src/app/api/auth/[...nextauth]/route.ts`)
- **State Management**: Zustand stores in `src/store`
- **Charts & Visualizations**:
  - ApexCharts (`apexcharts`, `react-apexcharts`)
  - FullCalendar (`@fullcalendar/*`)
  - React JVectorMap (`@react-jvectormap/*`)

### Getting Started

#### Prerequisites

- Node.js 18+ (LTS recommended)
- npm (bundled with Node)

#### 1. Install dependencies

```bash
npm install
```

#### 2. Environment variables

Create a `.env` file in the project root (if it does not already exist) and configure the required environment variables for:

- **NextAuth** (e.g. `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, provider-specific keys)
- Any additional secrets/services you use

> Refer to your existing `.env` file (not committed to git) for exact variable names and values.

#### 3. Run the development server

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

#### 4. Build for production

```bash
npm run build
npm start
```

### Project Structure (High Level)

- `src/app`
  - `(unprotected)` – public routes, auth pages, error pages, feedback forms
  - `(protected)` – authenticated dashboard: analytics, campaigns, surveys, customers, wallet, settings
  - `api/auth/[...nextauth]` – NextAuth API route
- `src/components`
  - Feature-specific UIs (analytics, campaigns, surveys, customers, wallet, settings)
  - Shared UI primitives (buttons, dropdowns, modals, alerts, badges, etc.)
- `src/layout`
  - `AppHeader`, `AppSidebar`, layout shell components
- `src/context`
  - Theme and store initializer components
- `src/store`
  - Zustand stores for campaigns, customers, responses, surveys, users
- `public`
  - Logos, favicons, illustrations, and other static assets

### Scripts

- `npm run dev` – Start the development server
- `npm run build` – Create a production build
- `npm start` – Start the production server
- `npm run lint` – Run ESLint

### License

This project is licensed under the terms specified in `LICENSE`.