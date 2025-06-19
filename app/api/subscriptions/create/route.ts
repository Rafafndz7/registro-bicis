import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

// Usar Price IDs de PRODUCCIÓN en lugar de calcular precios
const PLAN_PRICE_IDS = {
  basic: "price_1RbaIiP2bAdrMLI6LPeUmgmN", // $40 MXN
  standard: "price_1RbaJWP2bAdrMLI61k1RvTtn", // $60 MXN
  family: "price_1RbaKNP2bAdrMLI6IehK5s3o", // $120 MXN
  premium: "price_1RbaKoP2bAdrMLI6iNSK4dHl", // $180 MXN
}

const planLimits = {
  basic: { bicycleLimit: 1, name: "básico" },
  standard: { bicycleLimit: 2, name: "estándar" },
  family: { bicycleLimit: 4, name: "familiar" },
  premium: { bicycleLimit: 6, name: "premium" },
}

export async function POST(request: Request) {
  console.log("🚀 Creando suscripción en PRODUCCIÓN")

  const supabase = createServerClient()

  try {
    const { user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { planType, promoCode } = body

    console.log("📋 Datos recibidos:", { planType, promoCode, userId: user.user.id })

    // Obtener el Price ID y límites del plan
    const priceId = PLAN_PRICE_IDS[planType as keyof typeof PLAN_PRICE_IDS]
    const planInfo = planLimits[planType as keyof typeof planLimits]

    if (!priceId || !planInfo) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 })
    }

    console.log("💰 Usando Price ID de PRODUCCIÓN:", priceId)

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", user.user.id)
      .single()

    if (customerError) {
      console.error("❌ Error obteniendo customer:", customerError)
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }

    if (!customer?.stripe_customer_id) {
      console.error("❌ No se encontró el customer en Stripe")
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }

    const { data: session, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }

    // Crear sesión de checkout usando Price ID
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.stripe_customer_id,
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
    })

    console.log("✅ Sesión de checkout creada:", checkoutSession.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("❌ Error creando suscripción:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
