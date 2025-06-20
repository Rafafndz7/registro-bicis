import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { immediate = false } = await request.json()

    // Obtener suscripción activa
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        {
          error: "No se encontró suscripción activa",
        },
        { status: 404 },
      )
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        {
          error: "Suscripción sin ID de Stripe",
        },
        { status: 400 },
      )
    }

    try {
      if (immediate) {
        // Cancelar inmediatamente
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

        // Actualizar en base de datos
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)

        return NextResponse.json({
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
          message: "Suscripción programada para cancelación al final del período",
        })
      }
    } catch (stripeError: any) {
      console.error("Error with Stripe:", stripeError)
      return NextResponse.json(
        {
          error: "Error al procesar cancelación con Stripe: " + stripeError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error en POST /api/subscriptions/cancel:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
