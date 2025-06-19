import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

// Mapeo de Price IDs a planes (PRODUCCIÓN)
const PRICE_TO_PLAN = {
  price_1RbaIiP2bAdrMLI6LPeUmgmN: { planType: "básico", bicycleLimit: 1, price: 40 }, // $40
  price_1RbaJWP2bAdrMLI61k1RvTtn: { planType: "estándar", bicycleLimit: 2, price: 60 }, // $60
  price_1RbaKNP2bAdrMLI6IehK5s3o: { planType: "familiar", bicycleLimit: 4, price: 120 }, // $120
  price_1RbaKoP2bAdrMLI6iNSK4dHl: { planType: "premium", bicycleLimit: 6, price: 180 }, // $180
}

function getPlanFromPriceId(priceId: string): { planType: string; bicycleLimit: number; price: number } {
  console.log("💰 Detectando plan para Price ID:", priceId)

  const plan = PRICE_TO_PLAN[priceId as keyof typeof PRICE_TO_PLAN]
  if (plan) {
    console.log("✅ Plan encontrado:", plan)
    return plan
  }

  console.warn("⚠️ Price ID no reconocido:", priceId, "- usando plan básico por defecto")
  return { planType: "básico", bicycleLimit: 1, price: 40 }
}

export async function POST(request: Request) {
  console.log("🔔 =================================")
  console.log("🔔 WEBHOOK STRIPE RECIBIDO")
  console.log("🔔 =================================")

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    console.error("❌ No signature found")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    console.log("🔑 Webhook secret configurado:", webhookSecret ? "✅ SÍ" : "❌ NO")

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log("✅ Webhook verificado exitosamente")
    console.log("📋 Tipo de evento:", event.type)
    console.log("🆔 Event ID:", event.id)
  } catch (err) {
    console.error("❌ Error al verificar webhook:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Crear cliente de Supabase
  const supabase = createServerClient()
  console.log("🗄️ Cliente Supabase creado")

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("💳 =================================")
        console.log("💳 CHECKOUT SESSION COMPLETED")
        console.log("💳 =================================")
        console.log("💳 Session ID:", session.id)
        console.log("💳 Mode:", session.mode)
        console.log("💳 Payment Status:", session.payment_status)
        console.log("💳 Customer:", session.customer)
        console.log("💳 Subscription:", session.subscription)
        console.log("💳 Metadata:", session.metadata)

        if (session.mode === "subscription" && session.payment_status === "paid") {
          const userId = session.metadata?.userId

          if (!userId) {
            console.error("❌ No se encontró userId en metadatos")
            console.error("❌ Metadatos disponibles:", session.metadata)
            return NextResponse.json({ error: "No userId in metadata" }, { status: 400 })
          }

          console.log("👤 Usuario ID encontrado:", userId)

          // Obtener detalles de la suscripción de Stripe
          console.log("🔍 Obteniendo detalles de suscripción de Stripe...")
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price.id

          console.log("📊 Detalles de suscripción:")
          console.log("📊 Subscription ID:", subscription.id)
          console.log("📊 Status:", subscription.status)
          console.log("📊 Price ID:", priceId)
          console.log("📊 Current period start:", subscription.current_period_start)
          console.log("📊 Current period end:", subscription.current_period_end)

          if (!priceId) {
            console.error("❌ No se encontró Price ID en la suscripción")
            return NextResponse.json({ error: "No price ID found" }, { status: 400 })
          }

          // Determinar el plan basado en el Price ID
          const { planType, bicycleLimit, price } = getPlanFromPriceId(priceId)

          console.log("🎯 Plan determinado:")
          console.log("🎯 Tipo:", planType)
          console.log("🎯 Límite de bicis:", bicycleLimit)
          console.log("🎯 Precio:", price)

          // Verificar si ya existe una suscripción para este usuario
          console.log("🔍 Verificando suscripciones existentes...")
          const { data: existingSubscriptions, error: checkError } = await supabase
            .from("subscriptions")
            .select("id, status, stripe_subscription_id")
            .eq("user_id", userId)

          if (checkError) {
            console.error("❌ Error verificando suscripciones existentes:", checkError)
          } else {
            console.log("📋 Suscripciones existentes:", existingSubscriptions)
          }

          // Cancelar suscripciones anteriores del usuario
          if (existingSubscriptions && existingSubscriptions.length > 0) {
            console.log("🔄 Cancelando suscripciones anteriores...")
            const { error: cancelError } = await supabase
              .from("subscriptions")
              .update({
                status: "canceled",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId)
              .neq("status", "canceled")

            if (cancelError) {
              console.error("⚠️ Error cancelando suscripciones anteriores:", cancelError)
            } else {
              console.log("✅ Suscripciones anteriores canceladas")
            }
          }

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

          console.log("💾 =================================")
          console.log("💾 INSERTANDO SUSCRIPCIÓN EN BD")
          console.log("💾 =================================")
          console.log("💾 Datos a insertar:", JSON.stringify(subscriptionData, null, 2))

          const { data: newSubscription, error: insertError } = await supabase
            .from("subscriptions")
            .insert(subscriptionData)
            .select()
            .single()

          if (insertError) {
            console.error("❌ =================================")
            console.error("❌ ERROR INSERTANDO SUSCRIPCIÓN")
            console.error("❌ =================================")
            console.error("❌ Error:", insertError)
            console.error("❌ Code:", insertError.code)
            console.error("❌ Message:", insertError.message)
            console.error("❌ Details:", insertError.details)
            console.error("❌ Hint:", insertError.hint)

            return NextResponse.json(
              {
                error: "Error creating subscription",
                details: insertError.message,
                code: insertError.code,
              },
              { status: 500 },
            )
          }

          console.log("🎉 =================================")
          console.log("🎉 SUSCRIPCIÓN CREADA EXITOSAMENTE")
          console.log("🎉 =================================")
          console.log("🎉 Suscripción:", JSON.stringify(newSubscription, null, 2))

          return NextResponse.json({
            success: true,
            subscription: newSubscription,
            message: "Suscripción creada correctamente",
          })
        } else {
          console.log("ℹ️ Session no es de suscripción o pago no completado")
          console.log("ℹ️ Mode:", session.mode)
          console.log("ℹ️ Payment Status:", session.payment_status)
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("💰 =================================")
        console.log("💰 INVOICE PAYMENT SUCCEEDED")
        console.log("💰 =================================")
        console.log("💰 Invoice ID:", invoice.id)
        console.log("💰 Subscription:", invoice.subscription)

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const priceId = subscription.items.data[0]?.price.id

          if (priceId) {
            const { planType, bicycleLimit } = getPlanFromPriceId(priceId)

            console.log("🔄 Actualizando suscripción existente...")
            const { data: updatedSubscription, error: updateError } = await supabase
              .from("subscriptions")
              .update({
                status: "active",
                plan_type: planType,
                bicycle_limit: bicycleLimit,
                current_period_start: new Date(invoice.period_start * 1000).toISOString(),
                current_period_end: new Date(invoice.period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", invoice.subscription as string)
              .select()

            if (updateError) {
              console.error("❌ Error actualizando suscripción:", updateError)
            } else {
              console.log("✅ Suscripción actualizada:", updatedSubscription)
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
    console.error("❌ =================================")
    console.error("❌ ERROR GENERAL EN WEBHOOK")
    console.error("❌ =================================")
    console.error("❌ Error:", error)
    console.error("❌ Stack:", error instanceof Error ? error.stack : "No stack available")

    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
