import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
})

// Price IDs de PRODUCCIÓN
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

    // Obtener el Price ID y límites del plan
    const priceId = PLAN_PRICE_IDS[planType as keyof typeof PLAN_PRICE_IDS]
    const planInfo = planLimits[planType as keyof typeof planLimits]

    if (!priceId || !planInfo) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 })
    }

    console.log("💰 Usando Price ID de PRODUCCIÓN:", priceId)

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

    // Crear sesión de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
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
    })

    console.log("✅ Checkout session creado:", checkoutSession.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("❌ Error creating subscription:", error)
    return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 })
  }
}
