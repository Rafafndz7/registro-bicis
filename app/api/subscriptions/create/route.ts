import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

// Actualizar los Price IDs de PRODUCCIÓN - necesito el Price ID real del plan familiar
const PLAN_PRICE_IDS = {
  basic: "price_1RbaIiP2bAdrMLI6LPeUmgmN", // $40 MXN
  standard: "price_1RbaJWP2bAdrMLI61k1RvTtn", // $60 MXN
  family: "price_1Rc6XxP2bAdrMLI6WYUue92V", // $120 MXN - Plan familiar actualizado
  premium: "price_1RbaKoP2bAdrMLI6iNSK4dHl", // $180 MXN
}

const planLimits = {
  basic: { bicycleLimit: 1, name: "básico" },
  standard: { bicycleLimit: 2, name: "estándar" },
  family: { bicycleLimit: 4, name: "familiar" },
  premium: { bicycleLimit: 6, name: "premium" },
}

export async function POST(request: Request) {
  try {
    console.log("🚀 Iniciando creación de suscripción...")
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { planType = "basic", promoCode } = await request.json()

    console.log("🔍 Datos recibidos:", { planType, promoCode, userId: session.user.id })

    // Obtener el Price ID y límites del plan
    const priceId = PLAN_PRICE_IDS[planType as keyof typeof PLAN_PRICE_IDS]
    const planInfo = planLimits[planType as keyof typeof planLimits]

    if (!priceId || !planInfo) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 })
    }

    console.log("💰 Usando Price ID de PRODUCCIÓN:", priceId)

    // Validar código promocional si se proporciona
    let stripeCouponId = null
    if (promoCode) {
      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (promoError || !promo) {
        return NextResponse.json({ error: "Código promocional no válido" }, { status: 400 })
      }

      // Verificar validez del código
      const now = new Date()
      const validFrom = promo.valid_from ? new Date(promo.valid_from) : null
      const validUntil = promo.valid_until ? new Date(promo.valid_until) : null

      // Verificar fechas
      if (validFrom && validFrom > now) {
        return NextResponse.json({ error: "El código aún no es válido" }, { status: 400 })
      }

      if (validUntil && validUntil < now) {
        return NextResponse.json({ error: "El código ha expirado" }, { status: 400 })
      }

      // Verificar usos máximos
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        return NextResponse.json({ error: "El código ha alcanzado su límite de usos" }, { status: 400 })
      }

      // Verificar planes aplicables
      if (promo.applicable_plans && !promo.applicable_plans.includes(planType)) {
        return NextResponse.json({ error: "El código no es válido para este plan" }, { status: 400 })
      }

      stripeCouponId = promo.stripe_coupon_id
      console.log("🎟️ Usando cupón de Stripe:", stripeCouponId)

      // Incrementar el contador de usos
      if (promo.max_uses) {
        await supabase
          .from("promo_codes")
          .update({ current_uses: promo.current_uses + 1 })
          .eq("id", promo.id)
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

    // Validar que tenemos todos los datos necesarios
    if (!customer || !customer.id) {
      throw new Error("No se pudo crear o encontrar el customer de Stripe")
    }

    if (!priceId) {
      throw new Error("Price ID no encontrado para el plan: " + planType)
    }

    console.log("📋 Configuración del checkout:", {
      customerId: customer.id,
      priceId,
      planType,
      stripeCouponId,
      origin: request.headers.get("origin"),
    })

    // Configurar sesión de checkout
    const checkoutConfig: any = {
      customer: customer.id,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get("origin")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/subscription?canceled=true`,
      metadata: {
        userId: session.user.id,
        type: "subscription",
        planType: planInfo.name,
        bicycleLimit: planInfo.bicycleLimit.toString(),
        priceId: priceId,
        promoCode: promoCode || "",
      },
    }

    // Agregar cupón si existe
    if (stripeCouponId) {
      checkoutConfig.discounts = [{ coupon: stripeCouponId }]
      console.log("🎟️ Aplicando descuento:", stripeCouponId)
    }

    // Crear sesión de checkout
    const checkoutSession = await stripe.checkout.sessions.create(checkoutConfig)

    console.log("✅ Checkout session creado:", checkoutSession.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("❌ Error creating subscription:", error)
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack available")
    console.error("❌ Error message:", error instanceof Error ? error.message : "Unknown error")

    return NextResponse.json(
      {
        error: "Error al crear suscripción",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
