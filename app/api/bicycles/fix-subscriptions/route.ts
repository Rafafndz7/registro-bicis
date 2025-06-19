import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

function getPlanFromAmount(amount: number): { planType: string; bicycleLimit: number } {
  switch (amount) {
    case 4000:
      return { planType: "básico", bicycleLimit: 1 }
    case 6000:
      return { planType: "estándar", bicycleLimit: 2 }
    case 12000:
      return { planType: "familiar", bicycleLimit: 4 }
    case 18000:
      return { planType: "premium", bicycleLimit: 6 }
    default:
      return { planType: "básico", bicycleLimit: 1 }
  }
}

export async function POST() {
  try {
    const supabase = createServerClient()

    // Obtener todas las suscripciones con plan_type null
    const { data: subscriptions, error } = await supabase.from("subscriptions").select("*").is("plan_type", null)

    if (error) {
      console.error("Error obteniendo suscripciones:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Encontradas ${subscriptions?.length || 0} suscripciones para arreglar`)

    const results = []

    for (const subscription of subscriptions || []) {
      try {
        // Obtener la suscripción de Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id!)

        // Obtener el precio
        const priceId = stripeSubscription.items.data[0]?.price.id
        const price = await stripe.prices.retrieve(priceId!)
        const amount = price.unit_amount || 0

        const { planType, bicycleLimit } = getPlanFromAmount(amount)

        console.log(`Arreglando suscripción ${subscription.id}: ${amount} -> ${planType} (${bicycleLimit} bicis)`)

        // Actualizar en Supabase
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            plan_type: planType,
            bicycle_limit: bicycleLimit,
          })
          .eq("id", subscription.id)

        if (updateError) {
          console.error(`Error actualizando ${subscription.id}:`, updateError)
          results.push({ id: subscription.id, error: updateError.message })
        } else {
          results.push({ id: subscription.id, success: true, planType, bicycleLimit })
        }
      } catch (stripeError) {
        console.error(`Error con Stripe para ${subscription.id}:`, stripeError)
        results.push({ id: subscription.id, error: "Error de Stripe" })
      }
    }

    return NextResponse.json({
      message: "Proceso completado",
      results,
      total: subscriptions?.length || 0,
    })
  } catch (error) {
    console.error("Error general:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
