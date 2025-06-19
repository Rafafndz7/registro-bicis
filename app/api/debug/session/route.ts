import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }

  try {
    console.log("🔍 Debugging session:", sessionId)

    // Obtener session de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log("📋 Session data:", JSON.stringify(session, null, 2))

    // Si hay suscripción, obtener detalles
    let subscriptionData = null
    if (session.subscription) {
      subscriptionData = await stripe.subscriptions.retrieve(session.subscription as string)
      console.log("📊 Subscription data:", JSON.stringify(subscriptionData, null, 2))
    }

    // Verificar en Supabase si existe
    const supabase = createServerClient()
    const { data: existingSubscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", session.subscription as string)
      .single()

    console.log("🗄️ Supabase check:", { existingSubscription, error })

    return NextResponse.json({
      session: {
        id: session.id,
        mode: session.mode,
        payment_status: session.payment_status,
        customer: session.customer,
        subscription: session.subscription,
        metadata: session.metadata,
      },
      subscriptionData: subscriptionData
        ? {
            id: subscriptionData.id,
            status: subscriptionData.status,
            items: subscriptionData.items.data.map((item) => ({
              price_id: item.price.id,
              product: item.price.product,
            })),
            current_period_start: subscriptionData.current_period_start,
            current_period_end: subscriptionData.current_period_end,
          }
        : null,
      supabaseCheck: {
        exists: !!existingSubscription,
        data: existingSubscription,
        error: error?.message,
      },
    })
  } catch (error) {
    console.error("❌ Debug error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
