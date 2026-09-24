<div align="center">

# 🛒 Vanik

**Independent shops, one checkout.**

A multi-vendor marketplace for Indian makers. Independent shops (Pondicherry pottery, Jaipur jewellery, Kanpur leather, Chikkamagaluru coffee, Kerala Ayurveda…) list their products, and customers add items from many shops to one cart and check out once — in ₹, by UPI, card, net banking, or cash on delivery. Each shop fulfils its own part of the order.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Drizzle_ORM-003B57?logo=sqlite&logoColor=white)](https://orm.drizzle.team/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Features

- **Shopper** — Multi-shop cart with single checkout, faceted search with filters, sorting, and autocomplete, guest cart merging on sign-in, wishlist, store follows, order tracking timeline, notification center, and dark mode.
- **Vendor** — Store setup wizard, product/variant/inventory management, order fulfilment state machine, revenue analytics, customer reviews + replies, payout tracking, shipping rates, team management, and support tickets.
- **Platform** — INR pricing with GST, UPI/RuPay/COD payments, promo codes, per-vendor shipping, transactional orders with no-oversell stock checks, order splitting per shop, cancellation with stock restore and refund, and role-based auth.

---

## Built for India

- **Pricing & Currency:** Prices stored in paise and shown in ₹ with lakh/crore grouping (e.g. ₹1,23,456). GST-inclusive pricing with GST breakdown calculated at checkout.
- **Indian Addresses:** Structured for Indian addresses with flat/building, street/area, all states & Union Territories, 6-digit PIN code validation, and +91 mobile verification.
- **Couriers & Logistics:** Delhivery, Blue Dart, India Post, Ekart, DTDC, and Xpressbees with Monday–Saturday delivery estimates and tracking in Indian Standard Time (IST).
- **Vendor Payouts:** Bank account transfers via IFSC or UPI ID, with automated 8% commission + ₹10 payout fee.

---

## Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3 | App Router, React 19, Turbopack |
| **Styling** | Tailwind CSS v4 | CSS-first `@theme` tokens, cream canvas, black borders, hard shadows |
| **UI Components** | shadcn/ui (Radix) | Restyled with neobrutalism theme ([neobrutalism.dev](https://www.neobrutalism.dev)), Lucide, Sonner, Recharts |
| **Database** | SQLite (libSQL) | Drizzle ORM |
| **Authentication** | Better Auth | Email/password, role-based sessions |

---

## Quick Start

> **Requires** Node 20.9+

```bash
# Clone the repository
git clone https://github.com/RishiBuilds/vanik.git
cd vanik

# Install dependencies and set up environment
npm install
cp .env.example .env

# Push schema and seed demo data
npm run setup

# Start dev server
npm run dev
```

> **Note:** `npm run db:reset` re-creates demo data at any time.

---

## Demo Accounts

Password for all accounts: **`vanik-demo`**  
*(One-click sign-in buttons are available on the login page)*

| Role | Email | Includes |
| :--- | :--- | :--- |
| **Shopper** | `customer@vanik.dev` | Rishi Chaurasia (Bengaluru): orders in every state, pre-filled cart, wishlist, saved UPI ID & cards, notifications |
| **Vendor** | `vendor@vanik.dev` | "Mitti Studio" (Puducherry) with 90 days of orders, analytics, reviews, payouts, tickets |

### Promo Codes

| Code | Discount | Condition |
| :--- | :--- | :--- |
| `WELCOME10` | 10% off | Valid on entire order |
| `FREESHIP` | Free delivery | Orders above ₹499 |
| `VANIK250` | ₹250 off | Orders above ₹2,499 |
| `DIWALI15` | 15% off | Orders above ₹1,999 |

### Test Payments (Simulated)

- **UPI:** Any UPI ID (e.g. `name@okhdfcbank`)
- **Cards (Success):** Visa `4242 4242 4242 4242` or RuPay `6521 1111 1111 1110` (any CVV / future expiry)
- **Cards (Decline):** `4000 0000 0000 0002`
- **Other:** Net banking, Vanik Wallet, Cash on Delivery (COD up to ₹25,000)

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run setup` | Push schema + seed data |
| `npm run db:reset` | Re-seed demo data |
| `npm run db:studio` | Drizzle Studio |

---

## Roadmap

- [ ] Stripe PaymentIntents with Connect and webhooks
- [ ] Hosted search with typo tolerance and relevance tuning
- [ ] Transactional email, shopper-shop messaging, abandoned-cart reminders
- [ ] Shipping labels, tracking webhooks, international addresses
- [ ] Payout scheduler, returns/RMA, admin console
- [ ] Postgres, object storage, rate limiting, E2E tests

---

<div align="center">

**Built by [Rishi](https://github.com/RishiBuilds)**

</div>
