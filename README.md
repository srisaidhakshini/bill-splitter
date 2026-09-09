# 💸 Bill Splitter

A web app to track personal expenses and split shared costs with friends and groups — no more messy WhatsApp threads or forgotten debts.

## Features

- **Personal Expense Tracking** — Log your own spending like a money diary
- **Group Expenses** — Create groups, add members, and split costs automatically
- **Smart Settlements** — The app calculates who owes who with minimal transactions
- **Real-time Sync** — All members see expenses update instantly
- **Authentication** — Secure sign up and login via Supabase Auth

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 |
| Styling | Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/bill-splitter.git
   cd bill-splitter
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase project URL and anon key in `.env.local`.

4. **Set up the database**

   Run the SQL in [`supabase_setup.sql`](./supabase_setup.sql) in your Supabase SQL editor.

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |

See [`.env.example`](./.env.example) for the full template.

## Deployment

Deploy to [Vercel](https://vercel.com) in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Add your environment variables in the Vercel project settings before deploying.

## License

This project is licensed under the [MIT License](./LICENSE).
