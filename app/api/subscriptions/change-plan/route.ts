import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

const STRIPE_PRICE_IDS = {
  basic: "price_1RjjmZP2bAdrMLI67IFcuy4c", // Reemplaza con tus IDs reales
  standard: "price_1RjjnnP2bAdrMLI67PMbr076",
  family: "price_1RjjpIP2bAdrMLI6fMMyUqLK",
  premium: "price_1RjjooP2bAdrMLI6pKfYfcAn",
}

const PLAN_LIMITS = {
  basic: 1,
  standard: 2,
  family: 4,
  premium: 6,
}

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

    const { newPlan } = await request.json()

    if (!newPlan || !STRIPE_PRICE_IDS[newPlan as keyof typeof STRIPE_PRICE_IDS]) {
      return NextResponse.json(
        {
          error: "Plan no válido",
        },
        { status: 400 },
      )
    }

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

    if (subscription.plan_type === newPlan) {
      return NextResponse.json(
        {
          error: "Ya tienes este plan activo",
        },
        { status: 400 },
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

    // Verificar si el usuario tiene más bicicletas que el límite del nuevo plan
    const { count: bicycleCount } = await supabase
      .from("bicycles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    const newLimit = PLAN_LIMITS[newPlan as keyof typeof PLAN_LIMITS]
    if ((bicycleCount || 0) > newLimit) {
      return NextResponse.json(
        {
          error: `No puedes cambiar a este plan. Tienes ${bicycleCount} bicicletas registradas y el plan ${newPlan} solo permite ${newLimit}.`,
        },
        { status: 400 },
      )
    }

    try {
      // Obtener la suscripción de Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)

      const currentPriceId = stripeSubscription.items.data[0].price.id
      const newPriceId = STRIPE_PRICE_IDS[newPlan as keyof typeof STRIPE_PRICE_IDS]

      // Actualizar la suscripción en Stripe
      const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations", // Crear prorrateo
      })

      // Actualizar en base de datos
      await supabase
        .from("subscriptions")
        .update({
          plan_type: newPlan,
          bicycle_limit: newLimit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

      return NextResponse.json({
        message: `Plan cambiado exitosamente a ${newPlan}`,
        subscription: {
          plan_type: newPlan,
          bicycle_limit: newLimit,
        },
      })
    } catch (stripeError: any) {
      console.error("Error with Stripe:", stripeError)
      return NextResponse.json(
        {
          error: "Error al procesar cambio de plan con Stripe: " + stripeError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error en POST /api/subscriptions/change-plan:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
