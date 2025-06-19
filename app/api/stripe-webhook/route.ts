import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    console.log("✅ Webhook verificado:", event.type)
  } catch (err) {
    console.error("❌ Error al verificar webhook:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("💳 Checkout completado:", session.id)
        console.log("📋 Metadatos recibidos:", session.metadata)

        if (session.mode === "subscription" && session.metadata?.type === "subscription") {
          const userId = session.metadata.userId
          const planType = session.metadata.planType || "basic"
          const bicycleLimit = Number.parseInt(session.metadata.bicycleLimit || "1")

          console.log("🔍 Datos extraídos:", { userId, planType, bicycleLimit })

          if (!userId) {
            console.error("❌ No se encontró userId en metadatos")
            throw new Error("userId no encontrado en metadatos")
          }

          // Cancelar suscripciones anteriores del usuario
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
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }

          console.log("💾 Creando suscripción con datos:", subscriptionData)

          const { data: newSubscription, error: insertError } = await supabase
            .from("subscriptions")
            .insert(subscriptionData)
            .select()
            .single()

          if (insertError) {
            console.error("❌ Error creando suscripción:", insertError)
            throw insertError
          }

          console.log("✅ Suscripción creada exitosamente:", newSubscription)
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("💰 Pago exitoso para suscripción:", invoice.subscription)

        if (invoice.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(invoice.period_start * 1000).toISOString(),
              current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string)

          if (error) {
            console.error("❌ Error actualizando suscripción:", error)
            throw error
          }

          console.log("✅ Suscripción actualizada por pago exitoso")
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("💸 Pago fallido para suscripción:", invoice.subscription)

        if (invoice.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string)

          if (error) {
            console.error("❌ Error actualizando suscripción fallida:", error)
            throw error
          }

          console.log("⚠️ Suscripción marcada como vencida")
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("🗑️ Suscripción cancelada:", subscription.id)

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id)

        if (error) {
          console.error("❌ Error cancelando suscripción:", error)
          throw error
        }

        console.log("✅ Suscripción cancelada en BD")
        break
      }

      default:
        console.log("ℹ️ Evento no manejado:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Error procesando webhook:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
