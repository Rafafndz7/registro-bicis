import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

// Actualizar el mapeo de Price IDs - cambiar el plan familiar
const PRICE_TO_PLAN = {
  price_1RbaIiP2bAdrMLI6LPeUmgmN: { planType: "básico", bicycleLimit: 1, price: 40 }, // $40
  price_1RbaJWP2bAdrMLI61k1RvTtn: { planType: "estándar", bicycleLimit: 2, price: 60 }, // $60
  price_NUEVO_PRICE_ID_FAMILIAR_120: { planType: "familiar", bicycleLimit: 4, price: 120 }, // $120 - ACTUALIZAR
  price_1RbaKoP2bAdrMLI6iNSK4dHl: { planType: "premium", bicycleLimit: 6, price: 180 }, // $180
}

function getPlanFromPriceId(priceId: string): { planType: string; bicycleLimit: number; price: number } {
  const plan = PRICE_TO_PLAN[priceId as keyof typeof PRICE_TO_PLAN]
  if (plan) {
    return plan
  }
  return { planType: "básico", bicycleLimit: 1, price: 40 }
}

export async function POST(request: Request) {
  const { sessionId } = await request.json()

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }

  try {
    console.log("🔧 Manual processing session:", sessionId)

    // Obtener session de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.mode !== "subscription" || session.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Session is not a paid subscription",
          mode: session.mode,
          payment_status: session.payment_status,
        },
        { status: 400 },
      )
    }

    const userId = session.metadata?.userId
    if (!userId) {
      return NextResponse.json({ error: "No userId in metadata" }, { status: 400 })
    }

    // Obtener detalles de la suscripción
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = subscription.items.data[0]?.price.id

    if (!priceId) {
      return NextResponse.json({ error: "No price ID found" }, { status: 400 })
    }

    const { planType, bicycleLimit } = getPlanFromPriceId(priceId)

    const supabase = createServerClient()

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", session.subscription as string)
      .single()

    if (existing) {
      return NextResponse.json({
        message: "Subscription already exists",
        subscription_id: existing.id,
      })
    }

    // Cancelar suscripciones anteriores
    await supabase
      .from("subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .neq("status", "canceled")

    // Crear nueva suscripción
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      status: subscription.status,
      plan_type: planType,
      bicycle_limit: bicycleLimit,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: newSubscription, error: insertError } = await supabase
      .from("subscriptions")
      .insert(subscriptionData)
      .select()
      .single()

    if (insertError) {
      console.error("❌ Insert error:", insertError)
      return NextResponse.json(
        {
          error: "Failed to create subscription",
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Subscription created manually",
      subscription: newSubscription,
    })
  } catch (error) {
    console.error("❌ Manual process error:", error)
    return NextResponse.json(
      {
        error: "Manual processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
