import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const planPrices = {
  basic: { amount: 4000, bicycleLimit: 1, name: "básico" },
  standard: { amount: 6000, bicycleLimit: 2, name: "estándar" },
  family: { amount: 12000, bicycleLimit: 4, name: "familiar" },
  premium: { amount: 18000, bicycleLimit: 6, name: "premium" },
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

    const { planType = "basic", promoCode } = await request.json()

    console.log("🔍 Datos recibidos:", { planType, promoCode, userId: session.user.id })

    if (!planPrices[planType as keyof typeof planPrices]) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 })
    }

    const selectedPlan = planPrices[planType as keyof typeof planPrices]
    let finalAmount = selectedPlan.amount
    let discountAmount = 0

    console.log("📋 Plan seleccionado:", selectedPlan)

    // Validar código promocional si se proporciona
    if (promoCode) {
      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (!promoError && promo) {
        const now = new Date()
        const validFrom = promo.valid_from ? new Date(promo.valid_from) : null
        const validUntil = promo.valid_until ? new Date(promo.valid_until) : null

        if (
          (!validFrom || validFrom <= now) &&
          (!validUntil || validUntil >= now) &&
          (!promo.max_uses || promo.current_uses < promo.max_uses) &&
          (!promo.applicable_plans || promo.applicable_plans.includes(planType))
        ) {
          if (promo.discount_type === "percentage") {
            discountAmount = Math.round((selectedPlan.amount * promo.discount_value) / 100)
          } else if (promo.discount_type === "fixed") {
            discountAmount = Math.min(promo.discount_value * 100, selectedPlan.amount)
          }

          finalAmount = Math.max(selectedPlan.amount - discountAmount, 0)

          await supabase
            .from("promo_codes")
            .update({ current_uses: promo.current_uses + 1 })
            .eq("id", promo.id)

          console.log("💰 Descuento aplicado:", { discountAmount, finalAmount })
        }
      }
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("❌ Error obteniendo perfil:", profileError)
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    // Crear o recuperar customer de Stripe
    let customer
    const existingCustomers = await stripe.customers.list({
      email: profile.email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      console.log("👤 Customer existente encontrado:", customer.id)
    } else {
      customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name,
        metadata: {
          userId: session.user.id,
        },
      })
      console.log("👤 Nuevo customer creado:", customer.id)
    }

    // Metadatos que se pasarán al checkout
    const metadata = {
      userId: session.user.id,
      type: "subscription",
      planType: selectedPlan.name, // Usar el nombre correcto del plan
      bicycleLimit: selectedPlan.bicycleLimit.toString(),
      originalAmount: selectedPlan.amount.toString(),
      discountAmount: discountAmount.toString(),
      promoCode: promoCode || "",
    }

    console.log("📤 Metadatos para Stripe:", metadata)

    // Crear sesión de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `Plan ${selectedPlan.name} - RNB`,
              description: `Registro de hasta ${selectedPlan.bicycleLimit} bicicleta${selectedPlan.bicycleLimit > 1 ? "s" : ""}`,
            },
            unit_amount: finalAmount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get("origin")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/subscription?canceled=true`,
      metadata: metadata,
    })

    console.log("✅ Checkout session creado:", checkoutSession.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("❌ Error creating subscription:", error)
    return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 })
  }
}
