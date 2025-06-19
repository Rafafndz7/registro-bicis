import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

// Mapeo de Price IDs a planes (PRODUCCIÓN)
const PRICE_TO_PLAN = {
  price_1RbaIiP2bAdrMLI6LPeUmgmN: { planType: "básico", bicycleLimit: 1 },
  price_1RbaJWP2bAdrMLI61k1RvTtn: { planType: "estándar", bicycleLimit: 2 },
  price_1RbaKNP2bAdrMLI6IehK5s3o: { planType: "familiar", bicycleLimit: 4 },
  price_1RbaKoP2bAdrMLI6iNSK4dHl: { planType: "premium", bicycleLimit: 6 },
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Solo procesar checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      // Verificar que sea suscripción pagada
      if (session.mode === "subscription" && session.payment_status === "paid") {
        const userId = session.metadata?.userId

        if (!userId) {
          return NextResponse.json({ error: "No userId" }, { status: 400 })
        }

        // Obtener detalles de la suscripción
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price.id

        if (!priceId) {
          return NextResponse.json({ error: "No price ID" }, { status: 400 })
        }

        // Determinar el plan
        const planInfo = PRICE_TO_PLAN[priceId as keyof typeof PRICE_TO_PLAN]
        if (!planInfo) {
          return NextResponse.json({ error: "Invalid price ID" }, { status: 400 })
        }

        const supabase = createServerClient()

        try {
          // Cancelar suscripciones anteriores
          await supabase
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId)
            .neq("status", "canceled")

          // Crear nueva suscripción
          const { error } = await supabase.from("subscriptions").insert({
            user_id: userId,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            status: subscription.status,
            plan_type: planInfo.planType,
            bicycle_limit: planInfo.bicycleLimit,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })

          if (error) {
            console.error("Supabase error:", error)
            return NextResponse.json({ error: "Database error" }, { status: 500 })
          }

          return NextResponse.json({ success: true })
        } catch (dbError) {
          console.error("Database operation failed:", dbError)
          return NextResponse.json({ error: "Database operation failed" }, { status: 500 })
        }
      }
    }

    // Para todos los otros eventos, devolver success
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
