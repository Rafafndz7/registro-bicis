import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

export async function POST(request: Request) {
  try {
    const buf = await request.arrayBuffer()
    const body = Buffer.from(buf)
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("Processing webhook event:", event.type, event.id)

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === "subscription" && session.payment_status === "paid") {
        const userId = session.metadata?.userId
        const planType = session.metadata?.planType
        const bicycleLimit = session.metadata?.bicycleLimit

        console.log("Session metadata:", { userId, planType, bicycleLimit })

        if (!userId || !planType || !bicycleLimit) {
          console.error("Missing metadata:", { userId, planType, bicycleLimit })
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
        }

        const supabase = createServerClient()

        try {
          // Verificar que el usuario existe
          const { data: userExists, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .single()

          if (userError || !userExists) {
            console.error("User not found:", userId, userError)
            return NextResponse.json({ error: "User not found" }, { status: 400 })
          }

          console.log("User exists:", userExists.id)

          // Cancelar suscripciones anteriores
          const { error: cancelError } = await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .neq("status", "canceled")

          if (cancelError) {
            console.error("Error canceling previous subscriptions:", cancelError)
          }

          // Preparar datos de suscripción
          const subscriptionData = {
            user_id: userId,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            status: "active",
            plan_type: planType,
            bicycle_limit: Number.parseInt(bicycleLimit),
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          console.log("Inserting subscription data:", subscriptionData)

          // Crear nueva suscripción
          const { data, error } = await supabase.from("subscriptions").insert(subscriptionData).select()

          if (error) {
            console.error("Supabase insert error:", {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            })
            return NextResponse.json(
              {
                error: "Database insert failed",
                details: error.message,
                code: error.code,
              },
              { status: 500 },
            )
          }

          console.log("Subscription created successfully:", data)
          return NextResponse.json({ success: true, subscription: data })
        } catch (dbError) {
          console.error("Database operation failed:", dbError)
          return NextResponse.json(
            {
              error: "Database operation failed",
              details: dbError instanceof Error ? dbError.message : "Unknown error",
            },
            { status: 500 },
          )
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      {
        error: "Webhook failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
