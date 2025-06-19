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

    // Verificar que la bicicleta pertenezca al usuario
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("id, serial_number, brand, model, payment_status")
      .eq("id", bicycleId)
      .eq("user_id", session.user.id)
      .single()

    if (bicycleError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    // Si la bicicleta ya está pagada, no permitir otro pago
    if (bicycle.payment_status) {
      return NextResponse.json({ error: "Esta bicicleta ya está registrada y pagada" }, { status: 400 })
    }

    // Buscar pago pendiente existente o crear uno nuevo
    let payment
    const { data: existingPayment, error: paymentSearchError } = await supabase
      .from("payments")
      .select("id, amount, payment_status")
      .eq("bicycle_id", bicycleId)
      .eq("user_id", session.user.id)
      .single()

    if (paymentSearchError && paymentSearchError.code !== "PGRST116") {
      // Error diferente a "no encontrado"
      throw paymentSearchError
    }

    if (existingPayment) {
      // Si ya existe un pago pendiente, usarlo
      if (existingPayment.payment_status === "pending") {
        payment = existingPayment
      } else if (existingPayment.payment_status === "completed") {
        return NextResponse.json({ error: "Esta bicicleta ya está pagada" }, { status: 400 })
      }
    } else {
      // Crear nuevo registro de pago
      const { data: newPayment, error: newPaymentError } = await supabase
        .from("payments")
        .insert({
          user_id: session.user.id,
          bicycle_id: bicycleId,
          amount: 4000, // $40 MXN en centavos para Stripe
          payment_status: "pending",
        })
        .select()
        .single()

      if (newPaymentError) throw newPaymentError
      payment = newPayment
    }

    // Inicializar Stripe con la versión correcta
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY no está definida")
      return NextResponse.json({ error: "Error de configuración de Stripe" }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-04-30.basil" as any,
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
                name: `Suscripción Mensual RNB - ${bicycle.brand} ${bicycle.model}`,
                description: `Número de serie: ${bicycle.serial_number} - Suscripción mensual $40 MXN`,
              },
              unit_amount: 4000, // $40 MXN en centavos para Stripe
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
