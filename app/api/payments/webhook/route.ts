import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

// Esta ruta no verifica autenticación porque es llamada por Stripe
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") as string

  let event: Stripe.Event
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-04-30.basil" as any,
  })

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    return NextResponse.json({ error: "Webhook error", details: error }, { status: 400 })
  }

  // Manejar el evento de pago completado
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    // Extraer metadatos
    const { bicycleId, paymentId, userId } = session.metadata || {}

    if (bicycleId && paymentId && userId) {
      const supabase = createRouteHandlerClient({ cookies })

      // Actualizar el estado del pago
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          payment_status: "completed",
          stripe_payment_id: session.id,
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .eq("user_id", userId)

      if (paymentError) {
        console.error("Error al actualizar pago:", paymentError)
        return NextResponse.json({ error: "Error al actualizar pago", details: paymentError }, { status: 500 })
      }

      // Actualizar el estado de la bicicleta
      const { error: bicycleError } = await supabase
        .from("bicycles")
        .update({
          payment_status: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bicycleId)
        .eq("user_id", userId)

      if (bicycleError) {
        console.error("Error al actualizar bicicleta:", bicycleError)
        return NextResponse.json({ error: "Error al actualizar bicicleta", details: bicycleError }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
