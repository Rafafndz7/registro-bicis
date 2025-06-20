import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

const PLAN_PRICE_IDS = {
  basic: "price_1RbaIiP2bAdrMLI6LPeUmgmN",
  standard: "price_1RbaJWP2bAdrMLI61k1RvTtn",
  family: "price_1RbaKNP2bAdrMLI6IehK5s3o",
  premium: "price_1RbaKoP2bAdrMLI6iNSK4dHl",
}

const planLimits = {
  basic: { bicycleLimit: 1, name: "básico" },
  standard: { bicycleLimit: 2, name: "estándar" },
  family: { bicycleLimit: 4, name: "familiar" },
  premium: { bicycleLimit: 6, name: "premium" },
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { newPlan } = await request.json()

    if (!PLAN_PRICE_IDS[newPlan as keyof typeof PLAN_PRICE_IDS]) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 })
    }

    // Obtener suscripción actual
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: "No tienes suscripción activa" }, { status: 404 })
    }

    const currentPlan = subscription.plan_type
    const newPriceId = PLAN_PRICE_IDS[newPlan as keyof typeof PLAN_PRICE_IDS]

    // Obtener suscripción de Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const currentPriceId = stripeSubscription.items.data[0].price.id

    if (currentPriceId === newPriceId) {
      return NextResponse.json({ error: "Ya tienes este plan activo" }, { status: 400 })
    }

    // Determinar si es upgrade o downgrade
    const planOrder = ["basic", "standard", "family", "premium"]
    const currentIndex = planOrder.indexOf(currentPlan)
    const newIndex = planOrder.indexOf(newPlan)
    const isUpgrade = newIndex > currentIndex

    if (isUpgrade) {
      // Upgrade inmediato con proration
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      })

      // Actualizar en base de datos
      await supabase
        .from("subscriptions")
        .update({
          plan_type: newPlan,
          bicycle_limit: planLimits[newPlan as keyof typeof planLimits].bicycleLimit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

      return NextResponse.json({
        success: true,
        message: `Plan actualizado a ${newPlan}. Se cobrará la diferencia prorrateada.`,
        immediate: true,
      })
    } else {
      // Downgrade al final del período
      await supabase
        .from("subscriptions")
        .update({
          pending_plan_change: newPlan,
          pending_plan_change_date: subscription.current_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

      return NextResponse.json({
        success: true,
        message: `El plan cambiará a ${newPlan} al final del período actual (${new Date(subscription.current_period_end).toLocaleDateString()})`,
        immediate: false,
        changeDate: subscription.current_period_end,
      })
    }
  } catch (error) {
    console.error("Error al cambiar plan:", error)
    return NextResponse.json({ error: "Error al cambiar plan" }, { status: 500 })
  }
}
