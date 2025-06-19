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
  console.log("🔔 Webhook recibido")

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    console.error("❌ No signature")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    console.log("✅ Webhook verificado:", event.type)
  } catch (err) {
    console.error("❌ Error verificando webhook:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    console.log("💳 Session completada:", session.id)

    if (session.mode === "subscription" && session.payment_status === "paid") {
      const userId = session.metadata?.userId

      if (!userId) {
        console.error("❌ No userId en metadata")
        return NextResponse.json({ error: "No userId in metadata" }, { status: 400 })
      }

      console.log("👤 Usuario ID:", userId)
      console.log("🔗 Subscription ID:", session.subscription)

      try {
        // Obtener detalles de la suscripción
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price.id

        console.log("💰 Price ID:", priceId)

        if (!priceId) {
          console.error("❌ No price ID")
          return NextResponse.json({ error: "No price ID found" }, { status: 400 })
        }

        // Determinar el plan
        const planInfo = PRICE_TO_PLAN[priceId as keyof typeof PRICE_TO_PLAN]
        if (!planInfo) {
          console.error("❌ Price ID no válido:", priceId)
          return NextResponse.json({ error: "Invalid price ID" }, { status: 400 })
        }

        console.log("🎯 Plan detectado:", planInfo)

        const supabase = createServerClient()

        // Cancelar suscripciones anteriores
        console.log("🔄 Cancelando suscripciones anteriores...")
        const { error: cancelError } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("user_id", userId)
          .neq("status", "canceled")

        if (cancelError) {
          console.error("⚠️ Error cancelando anteriores:", cancelError)
        }

        // Crear nueva suscripción
        console.log("💾 Creando nueva suscripción...")
        const subscriptionData = {
          user_id: userId,
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          status: subscription.status,
          plan_type: planInfo.planType,
          bicycle_limit: planInfo.bicycleLimit,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }

        console.log("📋 Datos a insertar:", subscriptionData)

        const { data, error } = await supabase.from("subscriptions").insert(subscriptionData).select().single()

        if (error) {
          console.error("❌ Error insertando en Supabase:", error)
          console.error("❌ Código:", error.code)
          console.error("❌ Mensaje:", error.message)
          console.error("❌ Detalles:", error.details)
          return NextResponse.json(
            {
              error: "Database error",
              details: error.message,
              code: error.code,
            },
            { status: 500 },
          )
        }

        console.log("🎉 Suscripción creada exitosamente:", data)
        return NextResponse.json({ success: true, subscription: data })
      } catch (error) {
        console.error("❌ Error procesando:", error)
        return NextResponse.json(
          {
            error: "Processing failed",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else {
      console.log("ℹ️ Session no válida - Mode:", session.mode, "Status:", session.payment_status)
    }
  } else {
    console.log("ℹ️ Evento no manejado:", event.type)
  }

  return NextResponse.json({ received: true })
}
