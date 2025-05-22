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

    const { bicycleId } = await request.json()
    if (!bicycleId) {
      return NextResponse.json({ error: "Se requiere el ID de la bicicleta" }, { status: 400 })
    }

    // Verificar que la bicicleta pertenezca al usuario y esté pendiente de pago
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        bicycles (
          id,
          serial_number,
          brand,
          model
        )
      `)
      .eq("bicycle_id", bicycleId)
      .eq("user_id", session.user.id)
      .eq("payment_status", "pending")
      .single()

    if (paymentError || !payment) {
      console.error("Error al obtener el pago:", paymentError)
      return NextResponse.json({ error: "Pago no encontrado o ya procesado" }, { status: 404 })
    }

    // Inicializar Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY no está definida")
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
      console.error("Error al obtener el perfil:", profileError)
      throw profileError
    }

    // Crear sesión de checkout en Stripe
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "mxn",
              product_data: {
                name: `Registro de Bicicleta - ${payment.bicycles.brand} ${payment.bicycles.model}`,
                description: `Número de serie: ${payment.bicycles.serial_number}`,
              },
              unit_amount: payment.amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: profile.email,
        success_url: `${request.headers.get("origin")}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${request.headers.get("origin")}/payment/cancel`,
        metadata: {
          bicycleId,
          paymentId: payment.id,
          userId: session.user.id,
        },
      })

      return NextResponse.json({ url: checkoutSession.url })
    } catch (stripeError) {
      console.error("Error al crear sesión de Stripe:", stripeError)
      return NextResponse.json(
        { error: "Error al crear sesión de pago en Stripe", details: stripeError },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error general al crear sesión de pago:", error)
    return NextResponse.json({ error: "Error al crear sesión de pago", details: error }, { status: 500 })
  }
}
