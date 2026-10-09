# FoodBridge — Smart Food Waste Redistribution Platform

FoodBridge is an automated platform connecting food businesses (restaurants, supermarkets, hotels, caterers) with nearby verified shelters, orphanages, and community kitchens. It eliminates food waste by prioritizing food approaching expiry, matching compatible recipient demand, verifying transit feasibility, and tracking end-to-end delivery with proof-of-delivery codes.

---

## Architecture & Technology Stack

- **Framework**: Next.js 14.2 (App Router, Server Components & Route Handlers)
- **Frontend**: React 18, Tailwind CSS, Lucide React icons
- **Database**: MongoDB with Mongoose 8 (Indexes, 2dsphere Geospatial Index, Multi-Document Transactions)
- **Authentication**: NextAuth.js 4 (JWT session strategy, bcryptjs password hashing, role-based access control)
- **Validation**: Zod schema validation for all mutation endpoints
- **Geospatial & Maps**: Google Maps JavaScript API with native Haversine straight-line radar fallback
- **Test Suite**: Automated integration & unit test suite via `tsx`

---

## Core Capabilities

1. **Role-Based Workflows**:
   - **Food Provider (`PROVIDER`)**: Publish surplus food, specify dietary & storage requirements, review explainable shelter match rankings, dispatch offers, confirm driver pickup, and view waste-avoidance analytics.
   - **Shelter / Charity (`SHELTER`)**: Specify meal demand & dietary restrictions (e.g. Vegetarian, Halal, Allergen-free), browse marketplace surplus, request portions, track incoming deliveries, and confirm receipt using 6-digit handover codes.
   - **Administrator (`ADMIN`)**: Review and approve/reject pending organization registrations, audit allocations, inspect system impact statistics (CO₂e avoided, meals rescued), and view surplus forecasting.
   - **Delivery / Logistics (`DELIVERY`)**: Track pickup schedules, routes, and drop-off points.

2. **Smart Matching Engine (`src/lib/matching.ts`)**:
   - **Hard Eligibility Filtering**: Enforces administrative verification, pickup deadline headroom (accounting for transit time buffer), availability, and strict dietary/allergen compatibility.
   - **Multi-Factor Scoring (0–100)**:
     - Category fit (25%)
     - Expiry urgency (25%)
     - Quantity fit & shelter capacity (20%)
     - Distance & transit feasibility (20%)
     - Storage facility compatibility (10%)
   - **Human Explainability**: Provides transparent reasons for match scores and flags potential trade-offs.

3. **Concurrency-Safe Concurrency & Lifecycle**:
   - Atomic `$inc` quantity reservations guarded by remaining quantity checks.
   - Idempotency key protection prevents duplicate allocations on retries or double-clicks.
   - Safe cancellations: reserved food is restored back to the available pool without double-restoration risk.
   - Proof-of-delivery 6-digit confirmation code verification on completion.

4. **Persistent Notifications & Audit Logging**:
   - In-app notification bell with unread badge counter and real-time alerts.
   - Audit event logging for sensitive operations (verifications, allocations, cancellations).

5. **Surplus & Demand Forecasting (`src/lib/forecasting.ts`)**:
   - Grounded statistical moving averages and peak day predictions derived strictly from actual historical records.
   - Clear low-confidence warnings when historical records are sparse (< 5 records).

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **MongoDB**: A running MongoDB instance (MongoDB Atlas free tier recommended for replica set transaction support, or local MongoDB).

### 2. Installation
```bash
# Clone the repository and enter the directory
cd commitcon

# Install dependencies
npm install
```

### 3. Environment Setup
Copy the example environment file and configure your values:
```bash
cp .env.example .env.local
```
Fill in the following variables in `.env.local`:
- `MONGODB_URI`: MongoDB connection string.
- `NEXTAUTH_SECRET`: Random 32-byte secret (e.g., generated with `openssl rand -base64 32`).
- `NEXTAUTH_URL`: Base application URL (`http://localhost:3000`).
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: *(Optional)* Google Maps browser API key. If absent, the platform automatically renders the built-in Haversine geospatial radar visualizer.

### 4. Seed Demo Data (Local Evaluation)
To populate the database with realistic demo organizations, donations, and allocations:
```bash
npm run seed
```
**Demo Accounts Created**:
- **Superadmin**: `admin@foodbridge.org` | Password: `Admin@123456`
- **Verified Provider**: `bistro@foodbridge.org` | Password: `Provider@123456`
- **Pending Provider**: `hotel@foodbridge.org` | Password: `Provider@123456`
- **Verified Shelter**: `hope@foodbridge.org` | Password: `Shelter@123456`
- **Pending Shelter**: `haven@foodbridge.org` | Password: `Shelter@123456`

### 5. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Production Verification

### Run Automated Test Suite
The automated test runner executes 19 integration tests covering registration, authentication, verification gates, matching calculations, concurrency safety, cancellation restoration, delivery verification, analytics, and forecasting:
```bash
npm test
```

### Production Build
To create and validate an optimized production build:
```bash
npm run build
```

---

## Route Overview

| Path | Purpose | Role Required |
|---|---|---|
| `/` | Public Landing Page & Real-Time Impact Counters | Public |
| `/login` | Credentials sign-in with quick demo filler | Public |
| `/register` | Organization registration with coordinate picker | Public |
| `/restaurant/dashboard` | Provider analytics, active listings, quick actions | `PROVIDER` |
| `/restaurant/donations` | Full listings manager with search & withdraw | `PROVIDER` |
| `/restaurant/donations/new` | Create surplus listing with deadline & allergens | `PROVIDER` (Verified) |
| `/restaurant/donations/[id]` | Listing detail & Smart Match candidate ranking | `PROVIDER` |
| `/shelter/dashboard` | Shelter analytics, incoming offers, impact | `SHELTER` |
| `/shelter/donations` | Surplus marketplace with match scores & claim modal | `SHELTER` |
| `/shelter/requests` | Incoming allocation offers & acceptance controls | `SHELTER` |
| `/allocations` | Central allocation directory | Authenticated |
| `/allocations/[id]` | Full delivery timeline & 6-digit confirmation code | Authenticated |
| `/deliveries` | Logistics portal for active pickup runs | Authenticated |
| `/notifications` | Notification inbox with mark-read actions | Authenticated |
| `/profile` | Organization capacity & dietary demand settings | Authenticated |
| `/admin` | Admin center: pending approvals, forecast, metrics | `ADMIN` |
| `/admin/organizations` | Organization directory with approve/reject actions | `ADMIN` |

---

## Environmental Impact Calculation Methodology

FoodBridge calculates environmental metrics using established benchmarks from the **Food and Agriculture Organization (FAO)** and the **World Resources Institute (WRI)**:
- **CO₂e Emissions Avoided**: Each kilogram of edible surplus food rescued prevents approximately **2.5 kg CO₂e** emissions that would otherwise result from landfill methane and wasted agricultural supply chains.
- **Meals Equivalent**: One standard nourishing meal is calculated as **0.42 kg** of edible food (Global FoodBanking Network standard).
- All impact numbers displayed in the platform are derived from actual completed delivery records in the database.
