import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { immediate = false } = await request.json()

    // Obtener suscripción activa
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: "No tienes suscripción activa" }, { status: 404 })
    }

    if (immediate) {
      // Cancelar inmediatamente
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

      // Actualizar en base de datos
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

      return NextResponse.json({
        success: true,
        message: "Suscripción cancelada inmediatamente",
      })
    } else {
      // Cancelar al final del período
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      })

      // Actualizar en base de datos
      await supabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

      return NextResponse.json({
        success: true,
        message: "Suscripción se cancelará al final del período actual",
        cancelDate: subscription.current_period_end,
      })
    }
  } catch (error) {
    console.error("Error al cancelar suscripción:", error)
    return NextResponse.json({ error: "Error al cancelar suscripción" }, { status: 500 })
  }
}
