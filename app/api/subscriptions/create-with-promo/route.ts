import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
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

    const { planType, promoCode } = await request.json()

    // Definir precios base
    const planPrices = {
      basic: { price: 30, bicycles: 1 },
      standard: { price: 50, bicycles: 2 },
      family: { price: 90, bicycles: 4 },
      premium: { price: 140, bicycles: 6 },
    }

    const selectedPlan = planPrices[planType as keyof typeof planPrices]
    if (!selectedPlan) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 })
    }

    let finalPrice = selectedPlan.price
    let discountInfo = null

    // Validar código promocional si se proporciona
    if (promoCode) {
      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (!promoError && promo) {
        // Verificar validez del código
        const now = new Date()
        const validFrom = promo.valid_from ? new Date(promo.valid_from) : null
        const validUntil = promo.valid_until ? new Date(promo.valid_until) : null

        let isValidPromo = true

        if (validFrom && validFrom > now) isValidPromo = false
        if (validUntil && validUntil < now) isValidPromo = false
        if (promo.max_uses && promo.current_uses >= promo.max_uses) isValidPromo = false
        if (promo.applicable_plans && !promo.applicable_plans.includes(planType)) isValidPromo = false

        if (isValidPromo) {
          // Aplicar descuento
          if (promo.discount_type === "percentage") {
            finalPrice = selectedPlan.price - (selectedPlan.price * promo.discount_value) / 100
          } else {
            finalPrice = Math.max(selectedPlan.price - promo.discount_value, 0)
          }

          discountInfo = {
            code: promo.code,
            type: promo.discount_type,
            value: promo.discount_value,
            originalPrice: selectedPlan.price,
            finalPrice: Math.round(finalPrice),
          }

          // Incrementar uso del código
          await supabase
            .from("promo_codes")
            .update({ current_uses: promo.current_uses + 1 })
            .eq("id", promo.id)
        }
      }
    }

    // Crear precio dinámico en Stripe
    const stripePrice = await stripe.prices.create({
      unit_amount: Math.round(finalPrice * 100), // Convertir a centavos
      currency: "mxn",
      recurring: {
        interval: "month",
      },
      product_data: {
        name: `Plan ${planType.charAt(0).toUpperCase() + planType.slice(1)}`,
        description: `Registro de hasta ${selectedPlan.bicycles} bicicleta${selectedPlan.bicycles > 1 ? "s" : ""}`,
      },
    })

    // Crear sesión de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.headers.get("origin")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/subscription`,
      metadata: {
        user_id: session.user.id,
        plan_type: planType,
        bicycle_limit: selectedPlan.bicycles.toString(),
        promo_code: promoCode || "",
        original_price: selectedPlan.price.toString(),
        final_price: Math.round(finalPrice).toString(),
      },
    })

    // Guardar información de la suscripción pendiente
    await supabase.from("pending_subscriptions").insert({
      user_id: session.user.id,
      stripe_session_id: checkoutSession.id,
      plan_type: planType,
      bicycle_limit: selectedPlan.bicycles,
      original_price: selectedPlan.price,
      final_price: Math.round(finalPrice),
      promo_code: promoCode || null,
      discount_info: discountInfo,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      discountInfo,
    })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 })
  }
}
