import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

const planMapping = {
  basic: { bicycleLimit: 1, planType: "básico" },
  standard: { bicycleLimit: 2, planType: "estándar" },
  family: { bicycleLimit: 4, planType: "familiar" },
  premium: { bicycleLimit: 6, planType: "premium" },
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Checkout session completed:", session.id)

        if (session.mode === "subscription" && session.metadata?.type === "subscription") {
          const userId = session.metadata.userId
          const planType = session.metadata.planType || "basic"
          const bicycleLimit = Number.parseInt(session.metadata.bicycleLimit || "1")

          console.log("Processing subscription:", { userId, planType, bicycleLimit })

          // Cancelar suscripciones anteriores
          await supabase
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId)
            .eq("status", "active")

          // Crear nueva suscripción
          const { error: insertError } = await supabase.from("subscriptions").insert({
            user_id: userId,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            status: "active",
            plan_type: planType,
            bicycle_limit: bicycleLimit,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
          })

          if (insertError) {
            console.error("Error creating subscription:", insertError)
            throw insertError
          }

          console.log("Subscription created successfully")
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("Payment succeeded for subscription:", invoice.subscription)

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
            console.error("Error updating subscription:", error)
            throw error
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("Payment failed for subscription:", invoice.subscription)

        if (invoice.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string)

          if (error) {
            console.error("Error updating subscription status:", error)
            throw error
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("Subscription canceled:", subscription.id)

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id)

        if (error) {
          console.error("Error canceling subscription:", error)
          throw error
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
