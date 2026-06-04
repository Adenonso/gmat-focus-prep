import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const origin = req.headers.get('origin') || ''
    const priceId = body.priceId || process.env.STRIPE_PRO_PRICE_ID
    const userId = body.userId || ''

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      payment_method_types: ['card'],
      metadata: { userId }
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
