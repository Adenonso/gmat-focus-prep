# GMAT Focus Prep

AI-powered GMAT Focus Edition practice app built with Next.js 14, Tailwind CSS, Firebase, Stripe, and Anthropic Claude.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_SERVICE_ACCOUNT={...}
ANTHROPIC_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRO_PRICE_ID=...
```

3. Run development server:

```bash
npm run dev
```

## Notes

- The `/app/api/ai/route.ts` proxy sends AI requests to Anthropic Claude.
- The Stripe `/app/api/stripe/create-checkout` and webhook routes handle checkout sessions and plan upgrades.
- Lesson detail and mock exam pages use client-side Firebase auth and Firestore.
