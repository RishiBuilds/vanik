<div align="center">

<img src="https://raw.githubusercontent.com/RishiBuilds/vanik/main/public/vanik-logo.svg" alt="Vanik" width="36" height="36" />

# Vanik

### Independent shops, one checkout.

A multi-vendor marketplace built for Indian makers — from Pondicherry pottery and Jaipur jewellery to Kanpur leather and Chikkamagaluru coffee. Customers browse independent shops, add items from many sellers to **one cart**, and check out once — in **₹**, by UPI, card, net banking, or cash on delivery. Each shop fulfils its own part of the order.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Drizzle_ORM-003B57?logo=sqlite&logoColor=white)](https://orm.drizzle.team/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

<br />

## Features

### Shopper Experience

- **Multi-shop cart** — Add items from any number of stores and pay once
- **Smart search** — Faceted filters (category, price range, rating), sorting, and autocomplete
- **Guest cart merging** — Start shopping before signing up; items follow you after login
- **Wishlist & store follows** — Save products and get notified about stores you love
- **Order tracking timeline** — Visual state machine from placement → fulfilment → delivery
- **Notification center** — Order updates, price drops, and promo alerts
- **Dark mode** — Full dark theme with cream ↔ dark canvas swap

### Vendor Dashboard

- **Store setup wizard** — Guided onboarding: name, logo, banner, policies, payout method
- **Product management** — Create products with variants (size × colour), image galleries, specs, and tags
- **Inventory tracking** — Stock levels, low-stock alerts, SKU management
- **Order fulfilment** — State machine (pending → confirmed → packed → shipped → delivered) with cancellation + stock restore
- **Revenue analytics** — 90-day charts (revenue, orders, conversion), top products, customer breakdown
- **Customer reviews** — Ratings, review replies, and store-wide aggregation
- **Payout tracking** — Bank / UPI payouts with 8% commission + ₹10 fee ledger
- **Shipping rates** — Configurable per-zone rates with courier selection
- **Team management** — Invite staff with admin / editor / fulfilment roles
- **Support tickets** — Vendor ↔ platform communication channel

### Platform Capabilities

- **INR pricing** — Prices stored in paise, displayed in ₹ with lakh/crore grouping (₹1,23,456)
- **GST-inclusive checkout** — Tax breakdown calculated and displayed per item
- **Indian payments** — UPI, RuPay, Visa/Mastercard, net banking, Vanik Wallet, Cash on Delivery (up to ₹25,000)
- **Promo engine** — Percentage-off, flat-off, and free-shipping codes with min-order conditions
- **Order splitting** — One checkout → one order per shop, fulfilled independently
- **Transactional stock** — No-oversell checks within the order transaction
- **Cancellation flow** — Cancel with automatic stock restore and refund tracking
- **Role-based auth** — Customer and vendor roles via Better Auth with session management

---

## Built for India

| Area | Details |
| :--- | :--- |
| **Currency** | Prices in paise, displayed as ₹ with Indian grouping (₹1,23,456). GST-inclusive with breakdown at checkout. |
| **Addresses** | Flat/building, street/area, city, all 28 states + 8 UTs, 6-digit PIN code validation, +91 mobile numbers |
| **Couriers** | Delhivery, Blue Dart, India Post, Ekart, DTDC, Xpressbees — Mon–Sat delivery estimates in IST |
| **Payouts** | Bank transfer via IFSC or UPI ID, with automated 8% commission + ₹10 payout fee |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Next.js 16.3                      │
│              App Router · React 19 · Turbopack       │
├──────────────┬───────────────────┬───────────────────┤
│  Server      │  Server Actions   │  API Routes       │
│  Components  │  (mutations)      │  (auth webhooks)  │
├──────────────┴───────────────────┴───────────────────┤
│                   Drizzle ORM                        │
│             Type-safe queries & mutations            │
├──────────────────────────────────────────────────────┤
│              SQLite (libSQL) · Better Auth           │
└──────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3 | App Router with RSC for zero-JS server renders, Turbopack for instant HMR |
| **UI** | React 19 | Server Components, `use()` hook, Actions |
| **Styling** | Tailwind CSS v4 | CSS-first `@theme` tokens — cream canvas, black borders, hard shadows |
| **Components** | shadcn/ui + Radix | Neobrutalism theme from [neobrutalism.dev](https://www.neobrutalism.dev), fully accessible |
| **Charts** | Recharts | Vendor analytics dashboards |
| **Toasts** | Sonner | Non-blocking notifications |
| **Icons** | Lucide | Consistent icon set |
| **Database** | SQLite via libSQL | Embedded, zero-config — swap to Turso for production |
| **ORM** | Drizzle | Type-safe schema, migrations, and queries |
| **Auth** | Better Auth | Email/password, role-based sessions, secure cookies |
| **Validation** | Zod | Runtime schema validation for forms and server actions |
| **Language** | TypeScript 5 | End-to-end type safety |

---

## Project Structure

```
vanik/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, register, forgot password
│   │   ├── (shop)/              # Storefront routes
│   │   │   ├── page.tsx         #   → Homepage
│   │   │   ├── search/          #   → Search & browse
│   │   │   ├── c/               #   → Category pages
│   │   │   ├── p/               #   → Product detail pages
│   │   │   ├── s/               #   → Store profile pages
│   │   │   ├── stores/          #   → All stores directory
│   │   │   ├── cart/            #   → Shopping cart
│   │   │   ├── account/         #   → Shopper account (orders, wishlist, addresses, payments)
│   │   │   ├── sell/            #   → "Start selling" landing
│   │   │   ├── help/            #   → Help center
│   │   │   ├── legal/           #   → Terms, privacy, refund policy
│   │   │   └── about/           #   → About page
│   │   ├── checkout/            # Multi-step checkout flow
│   │   ├── vendor/
│   │   │   ├── onboarding/      #   → Store setup wizard
│   │   │   └── (dashboard)/     #   → Vendor panel (orders, products, analytics, etc.)
│   │   └── api/                 # API routes (auth, webhooks)
│   ├── components/
│   │   ├── shadcn/              # shadcn/ui primitives (neobrutalism-themed)
│   │   ├── ui/                  # Shared UI components
│   │   ├── layout/              # Header, footer, navigation
│   │   ├── browse/              # Search, filters, product grids
│   │   ├── product/             # Product cards, galleries, details
│   │   ├── cart/                # Cart drawer, line items
│   │   ├── checkout/            # Checkout steps, payment forms
│   │   ├── orders/              # Order timeline, status badges
│   │   ├── account/             # Account settings, address book
│   │   ├── vendor/              # Vendor dashboard widgets
│   │   ├── shop/                # Store profile components
│   │   ├── auth/                # Auth forms, guards
│   │   └── forms/               # Reusable form components
│   └── lib/
│       ├── db/
│       │   ├── schema.ts        # Drizzle schema (25+ tables)
│       │   └── index.ts         # Database client
│       ├── queries/             # Read-only data queries
│       ├── actions/             # Server actions (mutations)
│       ├── services/            # Business logic services
│       ├── auth.ts              # Better Auth config
│       ├── validation.ts        # Zod schemas
│       └── utils.ts             # Formatters, helpers
├── scripts/
│   └── seed.ts                  # Demo data seeder
├── data/                        # SQLite database file
└── public/                      # Static assets (avatars, uploads)
```

---

## Quick Start

> **Prerequisites:** Node.js 20.9+

### 1. Clone & install

```bash
git clone https://github.com/RishiBuilds/vanik.git
cd vanik
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Default `.env.example` values work out of the box for local development:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `file:./data/vanik.db` | SQLite database path |
| `BETTER_AUTH_SECRET` | *(placeholder)* | Session signing secret — replace in production |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Auth callback base URL |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public app URL |

### 3. Set up database & seed demo data

```bash
npm run setup
```

This pushes the Drizzle schema to SQLite and seeds demo shops, products, orders, reviews, and more.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're in.

> **Tip:** Run `npm run db:reset` at any time to wipe and re-seed demo data.

---

## Demo Accounts

**Password for all accounts:** `vanik-demo`
*(One-click sign-in buttons are available on the login page)*

| Role | Email | What's included |
| :--- | :--- | :--- |
| **Shopper** | `customer@vanik.dev` | Rishi Chaurasia (Bengaluru) — orders in every state, pre-filled cart, wishlist, saved UPI ID & cards, notifications |
| **Vendor** | `vendor@vanik.dev` | "Mitti Studio" (Puducherry) — 90 days of orders, revenue analytics, reviews, payouts, support tickets |

### Promo Codes

| Code | Discount | Condition |
| :--- | :--- | :--- |
| `WELCOME10` | 10% off | Valid on entire order |
| `FREESHIP` | Free delivery | Orders above ₹499 |
| `VANIK250` | ₹250 off | Orders above ₹2,499 |
| `DIWALI15` | 15% off | Orders above ₹1,999 |

### Test Payments (Simulated)

| Method | Details |
| :--- | :--- |
| **UPI** | Any UPI ID (e.g. `name@okhdfcbank`) |
| **Card (Success)** | Visa `4242 4242 4242 4242` or RuPay `6521 1111 1111 1110` — any CVV, future expiry |
| **Card (Decline)** | `4000 0000 0000 0002` |
| **Other** | Net Banking, Vanik Wallet, Cash on Delivery (COD up to ₹25,000) |

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run setup` | Push schema + seed demo data |
| `npm run db:reset` | Wipe and re-seed demo data |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

---

## Roadmap

- [ ] **Payments** — Stripe PaymentIntents with Connect, webhooks, and real refunds
- [ ] **Search** — Hosted search with typo tolerance and relevance tuning (Meilisearch / Algolia)
- [ ] **Messaging** — Transactional email, shopper ↔ shop messaging, abandoned-cart reminders
- [ ] **Shipping** — Label generation, tracking webhooks, international address support
- [ ] **Operations** — Payout scheduler, returns/RMA workflow, admin console
- [ ] **Infrastructure** — Postgres, object storage (S3/R2), rate limiting, E2E tests

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built by [Rishi](https://github.com/RishiBuilds)**

[Report Bug](https://github.com/RishiBuilds/vanik/issues) · [Request Feature](https://github.com/RishiBuilds/vanik/issues)

</div>
