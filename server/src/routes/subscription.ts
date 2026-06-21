import { Router, Request, Response } from 'express'
import Stripe from 'stripe'

const router = Router()

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' as any })
}

// POST /api/subscription/create-checkout
// Creates a Stripe Checkout Session and returns the URL
router.post('/create-checkout', async (req: Request, res: Response) => {
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })

  const { uid, email, returnUrl } = req.body as { uid: string; email: string; returnUrl: string }
  if (!uid || !email) return res.status(400).json({ error: 'uid and email required' })

  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) return res.status(503).json({ error: 'STRIPE_PRICE_ID not set' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { uid },
      subscription_data: { metadata: { uid } },
      success_url: `${returnUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/pricing`,
    })
    res.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

// GET /api/subscription/verify?session_id=xxx
// Called after successful checkout — returns subscription status + customer ID
router.get('/verify', async (req: Request, res: Response) => {
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })

  const { session_id } = req.query as { session_id: string }
  if (!session_id) return res.status(400).json({ error: 'session_id required' })

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    })

    const sub = session.subscription as Stripe.Subscription | null
    const active = sub?.status === 'active' || sub?.status === 'trialing'

    res.json({
      customerId: session.customer as string,
      uid: session.metadata?.uid ?? '',
      active,
      status: sub?.status ?? 'none',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

// GET /api/subscription/status?customerId=xxx
// Checks live subscription status for a customer
router.get('/status', async (req: Request, res: Response) => {
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })

  const { customerId } = req.query as { customerId: string }
  if (!customerId) return res.status(400).json({ error: 'customerId required' })

  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })
    res.json({ active: subs.data.length > 0, status: subs.data[0]?.status ?? 'none' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

// POST /api/subscription/webhook
// Stripe webhook — keep subscription status in sync
router.post('/webhook', async (req: Request, res: Response) => {
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })

  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      : (JSON.parse(req.body.toString()) as Stripe.Event)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook error'
    return res.status(400).send(`Webhook Error: ${msg}`)
  }

  // Log the event type — you can add Firestore writes here later
  console.log(`Stripe event: ${event.type}`)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      console.log(`New subscription: uid=${session.metadata?.uid} customer=${session.customer}`)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      console.log(`Subscription cancelled: customer=${sub.customer}`)
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      console.log(`Subscription updated: customer=${sub.customer} status=${sub.status}`)
      break
    }
  }

  res.json({ received: true })
})

// POST /api/subscription/portal
// Opens Stripe Customer Portal so users can manage/cancel
router.post('/portal', async (req: Request, res: Response) => {
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })

  const { customerId, returnUrl } = req.body as { customerId: string; returnUrl: string }
  if (!customerId) return res.status(400).json({ error: 'customerId required' })

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    res.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

export default router
