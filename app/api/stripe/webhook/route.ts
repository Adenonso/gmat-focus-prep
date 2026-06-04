import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })

// Firebase admin
import admin from 'firebase-admin'

if (!admin.apps.length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!sa) console.warn('FIREBASE_SERVICE_ACCOUNT not set — webhook will fail to update Firestore')
  else admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) })
}

const db = admin.apps.length ? admin.firestore() : null

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature') || ''
  const body = await req.text()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    // you can store mapping from session to user via metadata when creating session
    const userId = session.metadata?.userId
    if (db && userId) {
      await db.collection('users').doc(userId).set({ plan: 'pro' }, { merge: true })
    }
  }

  return NextResponse.json({ ok: true })
}
