import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  try {
    const { sessionId, userId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Se requiere session_id" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "Se requiere userId" }, { status: 400 })
    }

    console.log("Procesando suscripción para session:", sessionId, "usuario:", userId)

    // Inicializar Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY no está definida")
      return NextResponse.json({ error: "Error de configuración de Stripe" }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    })

    // Obtener información de la sesión de Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    console.log("Sesión de checkout:", {
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      mode: checkoutSession.mode,
      subscription: checkoutSession.subscription,
    })

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "El pago no está completado" }, { status: 400 })
    }

    if (checkoutSession.mode !== "subscription") {
      return NextResponse.json({ error: "Esta sesión no es de suscripción" }, { status: 400 })
    }

    if (!checkoutSession.subscription) {
      return NextResponse.json({ error: "No se encontró la suscripción en la sesión" }, { status: 400 })
    }

    // Obtener información de la suscripción
    const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription as string)
    console.log("Suscripción de Stripe:", {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
    })

    // Usar el cliente del servidor para insertar datos
    const supabase = createServerClient()

    // Verificar si ya existe en la base de datos
    const { data: existingSubscription, error: existingError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .single()

    if (existingSubscription && !existingError) {
      console.log("La suscripción ya existe en la base de datos")
      return NextResponse.json({ success: true, message: "Suscripción ya procesada" })
    }

    // Crear suscripción en la base de datos
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Insertando suscripción en base de datos:", subscriptionData)

    const { data: newSubscription, error: createError } = await supabase
      .from("subscriptions")
      .insert(subscriptionData)
      .select()
      .single()

    if (createError) {
      console.error("Error al crear suscripción:", createError)
      return NextResponse.json(
        {
          error: "Error al guardar en base de datos",
          details: createError.message,
        },
        { status: 500 },
      )
    }

    console.log("Suscripción creada exitosamente:", newSubscription)

    return NextResponse.json({
      success: true,
      subscription: newSubscription,
      message: "Suscripción procesada exitosamente",
    })
  } catch (error) {
    console.error("Error al procesar suscripción:", error)
    return NextResponse.json(
      {
        error: "Error al procesar suscripción",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
