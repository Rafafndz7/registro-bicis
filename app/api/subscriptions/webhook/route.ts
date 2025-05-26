import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") as string

  let event: Stripe.Event
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  })

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === "subscription") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        // Crear o actualizar suscripción en la base de datos
        const { error } = await supabase.from("subscriptions").upsert({
          user_id: session.metadata?.userId!,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) {
          console.error("Error al crear suscripción:", error)
        }
      }
      break

    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      const subscriptionEvent = event.data.object as Stripe.Subscription

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: subscriptionEvent.status,
          current_period_start: new Date(subscriptionEvent.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscriptionEvent.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionEvent.id)

      if (updateError) {
        console.error("Error al actualizar suscripción:", updateError)
      }
      break

    case "invoice.payment_failed":
      const invoice = event.data.object as Stripe.Invoice

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
        }
      }
      break
  }

  return NextResponse.json({ received: true })
}
