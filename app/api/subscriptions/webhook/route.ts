import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") as string

  console.log("Webhook recibido, signature:", signature ? "presente" : "ausente")

  let event: Stripe.Event
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  })

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    console.log("Evento de webhook validado:", event.type)
  } catch (error) {
    console.error("Error al validar webhook:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Checkout completado:", session.id, "Modo:", session.mode)

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          console.log("Procesando suscripción:", subscription.id)

          const subscriptionData = {
            user_id: session.metadata?.userId!,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { error } = await supabase.from("subscriptions").upsert(subscriptionData, {
            onConflict: "stripe_subscription_id",
          })

          if (error) {
            console.error("Error al crear suscripción:", error)
          } else {
            console.log("Suscripción creada/actualizada exitosamente")
          }
        }
        break

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription
        console.log("Suscripción actualizada:", updatedSubscription.id)

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: updatedSubscription.status,
            current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", updatedSubscription.id)

        if (updateError) {
          console.error("Error al actualizar suscripción:", updateError)
        } else {
          console.log("Suscripción actualizada exitosamente")
        }
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        console.log("Suscripción cancelada:", deletedSubscription.id)

        const { error: deleteError } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", deletedSubscription.id)

        if (deleteError) {
          console.error("Error al cancelar suscripción:", deleteError)
        } else {
          console.log("Suscripción cancelada exitosamente")
        }
        break

      case "invoice.payment_failed":
        const invoice = event.data.object as Stripe.Invoice
        console.log("Pago fallido para invoice:", invoice.id)

        if (invoice.subscription) {
          const { error: failedError } = await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string)

          if (failedError) {
            console.error("Error al actualizar suscripción fallida:", failedError)
          } else {
            console.log("Suscripción marcada como vencida")
          }
        }
        break

      default:
        console.log("Evento no manejado:", event.type)
    }
  } catch (error) {
    console.error("Error al procesar webhook:", error)
    return NextResponse.json({ error: "Error al procesar webhook" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
