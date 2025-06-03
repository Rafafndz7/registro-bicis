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

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: "Se requiere subscriptionId" }, { status: 400 })
    }

    console.log("Cancelando suscripción:", subscriptionId)

    // Verificar que la suscripción pertenezca al usuario
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", session.user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 })
    }

    // Inicializar Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    })

    // Cancelar en Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId)
    console.log("Suscripción cancelada en Stripe:", canceledSubscription.id)

    // Actualizar en la base de datos
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", session.user.id)

    if (updateError) {
      console.error("Error al actualizar suscripción:", updateError)
      throw updateError
    }

    console.log("Suscripción cancelada exitosamente")

    return NextResponse.json({
      success: true,
      message: "Suscripción cancelada exitosamente",
    })
  } catch (error) {
    console.error("Error al cancelar suscripción:", error)
    return NextResponse.json({ error: "Error al cancelar suscripción", details: error }, { status: 500 })
  }
}
