import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, stripeSubscriptionId, stripeCustomerId, status } = await request.json()

    if (!userId || !stripeSubscriptionId) {
      return NextResponse.json(
        {
          error: "Se requieren userId y stripeSubscriptionId",
        },
        { status: 400 },
      )
    }

    console.log("Insertando suscripción manual:", {
      userId,
      stripeSubscriptionId,
      stripeCustomerId,
      status,
    })

    const supabase = createServerClient()

    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: stripeSubscriptionId,
      status: status || "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("subscriptions").insert(subscriptionData).select().single()

    if (error) {
      console.error("Error al insertar suscripción:", error)
      return NextResponse.json(
        {
          error: "Error al insertar suscripción",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Suscripción insertada exitosamente:", data)

    return NextResponse.json({
      success: true,
      subscription: data,
      message: "Suscripción insertada exitosamente",
    })
  } catch (error) {
    console.error("Error al insertar suscripción manual:", error)
    return NextResponse.json(
      {
        error: "Error al insertar suscripción",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
