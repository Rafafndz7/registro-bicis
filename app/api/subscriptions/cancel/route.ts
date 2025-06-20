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

    console.log("🔍 Usuario intentando cancelar:", user.id)

    const { immediate = false } = await request.json()

    // Obtener suscripción activa del usuario actual
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (subError || !subscription) {
      console.log("❌ No se encontró suscripción activa para usuario:", user.id)

      // Debug: mostrar todas las suscripciones del usuario
      const { data: allUserSubs } = await supabase.from("subscriptions").select("*").eq("user_id", user.id)

      console.log("📋 Todas las suscripciones del usuario:", allUserSubs)

      return NextResponse.json(
        {
          error: "No se encontró suscripción activa para tu usuario",
          debug: {
            userId: user.id,
            userSubscriptions: allUserSubs,
          },
        },
        { status: 404 },
      )
    }

    console.log("✅ Suscripción encontrada:", {
      id: subscription.id,
      stripeId: subscription.stripe_subscription_id,
      status: subscription.status,
    })

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        {
          error: "Suscripción sin ID de Stripe",
        },
        { status: 400 },
      )
    }

    // Verificar que la suscripción existe en Stripe
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
      console.log("✅ Suscripción encontrada en Stripe:", {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        customerId: stripeSubscription.customer,
      })
    } catch (stripeRetrieveError: any) {
      console.error("❌ Suscripción no encontrada en Stripe:", stripeRetrieveError.message)

      return NextResponse.json(
        {
          error: "Suscripción no encontrada en Stripe",
          details: stripeRetrieveError.message,
          subscriptionId: subscription.stripe_subscription_id,
        },
        { status: 404 },
      )
    }

    try {
      if (immediate) {
        // Cancelar inmediatamente
        console.log("🚫 Cancelando inmediatamente...")
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

        console.log("✅ Suscripción cancelada inmediatamente")

        return NextResponse.json({
          message: "Suscripción cancelada inmediatamente",
        })
      } else {
        // Cancelar al final del período
        console.log("⏰ Programando cancelación al final del período...")
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

        console.log("✅ Suscripción programada para cancelación")

        return NextResponse.json({
          message: "Suscripción programada para cancelación al final del período",
        })
      }
    } catch (stripeError: any) {
      console.error("❌ Error with Stripe:", stripeError)
      return NextResponse.json(
        {
          error: "Error al procesar cancelación con Stripe: " + stripeError.message,
          code: stripeError.code,
          type: stripeError.type,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("💥 Error en POST /api/subscriptions/cancel:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
