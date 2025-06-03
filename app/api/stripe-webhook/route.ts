import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

// Esta ruta no verifica autenticación porque es llamada por Stripe
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") as string

  let event: Stripe.Event
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  })

  console.log("🔔 Webhook recibido de Stripe")

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    console.log("✅ Webhook verificado:", event.type)
  } catch (error) {
    console.error("❌ Error al verificar firma del webhook:", error)
    return NextResponse.json({ error: "Webhook error", details: error }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session
        console.log("💳 Checkout completado:", session.id)

        if (session.mode === "subscription") {
          // Manejar suscripción
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          console.log("📋 Procesando suscripción:", subscription.id)

          const { error: subError } = await supabase.from("subscriptions").upsert({
            user_id: session.metadata?.userId!,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (subError) {
            console.error("❌ Error al crear/actualizar suscripción:", subError)
            throw subError
          }

          console.log("✅ Suscripción guardada en BD")
        } else {
          // Manejar pago único (bicicletas)
          const { bicycleId, paymentId, userId } = session.metadata || {}
          console.log("🚲 Procesando pago de bicicleta:", { bicycleId, paymentId, userId })

          if (bicycleId && paymentId && userId) {
            // Actualizar el estado del pago
            const { error: paymentError } = await supabase
              .from("payments")
              .update({
                payment_status: "completed",
                stripe_payment_id: session.id,
                payment_date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", paymentId)
              .eq("user_id", userId)

            if (paymentError) {
              console.error("❌ Error al actualizar pago:", paymentError)
              throw paymentError
            }

            // Actualizar el estado de la bicicleta
            const { error: bicycleError } = await supabase
              .from("bicycles")
              .update({
                payment_status: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", bicycleId)
              .eq("user_id", userId)

            if (bicycleError) {
              console.error("❌ Error al actualizar bicicleta:", bicycleError)
              throw bicycleError
            }

            console.log("✅ Pago de bicicleta procesado")
          }
        }
        break

      case "customer.subscription.updated":
        const updatedSub = event.data.object as Stripe.Subscription
        console.log("🔄 Suscripción actualizada:", updatedSub.id)

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: updatedSub.status,
            current_period_start: new Date(updatedSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(updatedSub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", updatedSub.id)

        if (updateError) {
          console.error("❌ Error al actualizar suscripción:", updateError)
          throw updateError
        }

        console.log("✅ Suscripción actualizada en BD")
        break

      case "customer.subscription.deleted":
        const deletedSub = event.data.object as Stripe.Subscription
        console.log("🗑️ Suscripción cancelada:", deletedSub.id)

        const { error: deleteError } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", deletedSub.id)

        if (deleteError) {
          console.error("❌ Error al cancelar suscripción:", deleteError)
          throw deleteError
        }

        console.log("✅ Suscripción cancelada en BD")
        break

      case "invoice.payment_failed":
        const invoice = event.data.object as Stripe.Invoice
        console.log("💸 Pago fallido:", invoice.id)

        if (invoice.subscription) {
          const { error: failedError } = await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string)

          if (failedError) {
            console.error("❌ Error al actualizar suscripción fallida:", failedError)
            throw failedError
          }

          console.log("✅ Suscripción marcada como vencida")
        }
        break

      default:
        console.log("ℹ️ Evento no manejado:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Error procesando webhook:", error)
    return NextResponse.json({ error: "Error procesando webhook", details: error }, { status: 500 })
  }
}
