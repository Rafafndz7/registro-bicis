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

    console.log("Creando suscripción para usuario:", session.user.id)

    // Verificar si ya tiene una suscripción activa
    const { data: existingSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single()

    if (existingSubscription && !subError) {
      return NextResponse.json({ error: "Ya tienes una suscripción activa" }, { status: 400 })
    }

    // Obtener información del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    // Inicializar Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY no está definida")
      return NextResponse.json({ error: "Error de configuración de Stripe" }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    })

    console.log("Creando sesión de checkout en Stripe...")

    // Crear sesión de checkout para suscripción
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: profile.email,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: "Suscripción Mensual RNB",
              description: "Acceso completo al Registro Nacional de Bicicletas",
            },
            unit_amount: 4000, // $40 MXN en centavos
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get("origin")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/subscription?canceled=true`,
      metadata: {
        userId: session.user.id,
        type: "subscription",
      },
    })

    console.log("Sesión de checkout creada:", checkoutSession.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Error al crear suscripción:", error)
    return NextResponse.json({ error: "Error al crear suscripción", details: error }, { status: 500 })
  }
}
