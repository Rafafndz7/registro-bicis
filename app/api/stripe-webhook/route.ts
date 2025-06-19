import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

// Mapeo de Price IDs a planes
const PRICE_TO_PLAN = {
  price_1RbaIiP2bAdrMLI6LPeUmgmN: { planType: "básico", bicycleLimit: 1 }, // $40
  price_1RbaJWP2bAdrMLI61k1RvTtn: { planType: "estándar", bicycleLimit: 2 }, // $60
  price_1RbaKNP2bAdrMLI6IehK5s3o: { planType: "familiar", bicycleLimit: 4 }, // $120
  price_1RbaKoP2bAdrMLI6iNSK4dHl: { planType: "premium", bicycleLimit: 6 }, // $180
}

function getPlanFromPriceId(priceId: string): { planType: string; bicycleLimit: number } {
  console.log("💰 Detectando plan para Price ID:", priceId)

  const plan = PRICE_TO_PLAN[priceId as keyof typeof PRICE_TO_PLAN]
  if (plan) {
    console.log("✅ Plan encontrado:", plan)
    return plan
  }

  console.warn("⚠️ Price ID no reconocido:", priceId, "- usando plan básico por defecto")
  return { planType: "básico", bicycleLimit: 1 }
}

export async function POST(request: Request) {
  console.log("🔔 Webhook recibido - iniciando procesamiento")

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    console.error("❌ No signature found")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    console.log("🔑 Usando webhook secret:", webhookSecret ? "✅ Configurado" : "❌ No encontrado")

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log("✅ Webhook verificado:", event.type)
  } catch (err) {
    console.error("❌ Error al verificar webhook:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    console.log("📋 Procesando evento:", event.type)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("💳 Checkout completado:", {
          id: session.id,
          mode: session.mode,
          subscription: session.subscription,
          customer: session.customer,
          metadata: session.metadata,
        })

        if (session.mode === "subscription") {
          const userId = session.metadata?.userId

          if (!userId) {
            console.error("❌ No se encontró userId en metadatos:", session.metadata)
            return NextResponse.json({ error: "No userId in metadata" }, { status: 400 })
          }

          // Obtener detalles de la suscripción de Stripe
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price.id

          if (!priceId) {
            console.error("❌ No se encontró Price ID en la suscripción")
            return NextResponse.json({ error: "No price ID found" }, { status: 400 })
          }

          // Determinar el plan basado en el Price ID
          const { planType, bicycleLimit } = getPlanFromPriceId(priceId)

          console.log("🎯 Plan determinado:", {
            planType,
            bicycleLimit,
            priceId,
            userId,
          })

          // Cancelar suscripciones anteriores del usuario
          console.log("🔄 Cancelando suscripciones anteriores...")
          const { error: cancelError } = await supabase
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId)
            .neq("status", "canceled")

          if (cancelError) {
            console.error("⚠️ Error cancelando suscripciones anteriores:", cancelError)
          } else {
            console.log("✅ Suscripciones anteriores canceladas")
          }

          // Crear nueva suscripción
          const subscriptionData = {
            user_id: userId,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            status: "active",
            plan_type: planType,
            bicycle_limit: bicycleLimit,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }

          console.log("💾 Insertando suscripción en BD:", subscriptionData)

          const { data: newSubscription, error: insertError } = await supabase
            .from("subscriptions")
            .insert(subscriptionData)
            .select()
            .single()

          if (insertError) {
            console.error("❌ Error creando suscripción:", insertError)
            return NextResponse.json(
              {
                error: "Error creating subscription",
                details: insertError.message,
              },
              { status: 500 },
            )
          }

          console.log("🎉 Suscripción creada exitosamente:", newSubscription)

          return NextResponse.json({
            success: true,
            subscription: newSubscription,
            message: "Suscripción creada correctamente",
          })
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("💰 Pago exitoso para suscripción:", invoice.subscription)

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const priceId = subscription.items.data[0]?.price.id

          if (priceId) {
            const { planType, bicycleLimit } = getPlanFromPriceId(priceId)

            const { error } = await supabase
              .from("subscriptions")
              .update({
                status: "active",
                plan_type: planType,
                bicycle_limit: bicycleLimit,
                current_period_start: new Date(invoice.period_start * 1000).toISOString(),
                current_period_end: new Date(invoice.period_end * 1000).toISOString(),
              })
              .eq("stripe_subscription_id", invoice.subscription as string)

            if (error) {
              console.error("❌ Error actualizando suscripción:", error)
            } else {
              console.log("✅ Suscripción actualizada con plan:", planType)
            }
          }
        }
        break
      }

      default:
        console.log("ℹ️ Evento no manejado:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Error procesando webhook:", error)
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
