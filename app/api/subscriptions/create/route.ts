import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Inicializar Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Error de configuración de Stripe" }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    })

    // Obtener información del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Error al obtener el perfil" }, { status: 500 })
    }

    // Verificar si ya tiene una suscripción activa
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single()

    if (existingSubscription) {
      return NextResponse.json({ error: "Ya tienes una suscripción activa" }, { status: 400 })
    }

    // Crear o obtener customer en Stripe
    let customer
    const { data: existingCustomer } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", session.user.id)
      .not("stripe_customer_id", "is", null)
      .single()

    if (existingCustomer?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingCustomer.stripe_customer_id)
    } else {
      customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name,
        metadata: {
          userId: session.user.id,
        },
      })
    }

    // Crear sesión de checkout para suscripción
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: "Suscripción Registro Nacional de Bicicletas",
              description: "Acceso mensual al registro y protección de bicicletas",
            },
            unit_amount: 5000, // $50 MXN en centavos
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.headers.get("origin")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/subscription/cancel`,
      metadata: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Error al crear suscripción:", error)
    return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 })
  }
}
