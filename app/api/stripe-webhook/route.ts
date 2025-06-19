import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Función para determinar el plan basado en el precio
function getPlanFromAmount(amount: number): { planType: string; bicycleLimit: number } {
  console.log("💰 Detectando plan para monto:", amount)

  switch (amount) {
    case 4000: // $40 MXN
      return { planType: "básico", bicycleLimit: 1 }
    case 6000: // $60 MXN
      return { planType: "estándar", bicycleLimit: 2 }
    case 12000: // $120 MXN
      return { planType: "familiar", bicycleLimit: 4 }
    case 18000: // $180 MXN
      return { planType: "premium", bicycleLimit: 6 }
    default:
      console.warn("⚠️ Precio no reconocido:", amount, "- usando plan básico por defecto")
      return { planType: "básico", bicycleLimit: 1 }
  }
}

export async function POST(request: Request) {
  console.log("🔔 Webhook recibido - iniciando procesamiento")

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    console.error("❌ No signature found")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    console.log("✅ Webhook verificado:", event.type)
  } catch (err) {
    console.error("❌ Error al verificar webhook:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    console.log("📋 Procesando evento:", event.type)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("💳 Checkout completado:", {
          id: session.id,
          amount: session.amount_total,
          mode: session.mode,
          subscription: session.subscription,
          customer: session.customer,
          metadata: session.metadata,
        })

        if (session.mode === "subscription") {
          const userId = session.metadata?.userId

          if (!userId) {
            console.error("❌ No se encontró userId en metadatos:", session.metadata)
            return NextResponse.json({ error: "No userId in metadata" }, { status: 400 })
          }

          // Determinar el plan basado en el monto total
          const { planType, bicycleLimit } = getPlanFromAmount(session.amount_total || 0)

          console.log("🎯 Plan determinado:", {
            planType,
            bicycleLimit,
            amount: session.amount_total,
            userId,
          })

          // Cancelar suscripciones anteriores del usuario
          console.log("🔄 Cancelando suscripciones anteriores...")
          const { error: cancelError } = await supabase
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId)
            .neq("status", "canceled")

          if (cancelError) {
            console.error("⚠️ Error cancelando suscripciones anteriores:", cancelError)
          } else {
            console.log("✅ Suscripciones anteriores canceladas")
          }

          // Crear nueva suscripción con los datos correctos
          const subscriptionData = {
            user_id: userId,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            status: "active",
            plan_type: planType,
            bicycle_limit: bicycleLimit,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }

          console.log("💾 Insertando suscripción en BD:", subscriptionData)

          const { data: newSubscription, error: insertError } = await supabase
            .from("subscriptions")
            .insert(subscriptionData)
            .select()
            .single()

          if (insertError) {
            console.error("❌ Error creando suscripción:", insertError)
            console.error("❌ Datos que se intentaron insertar:", subscriptionData)
            return NextResponse.json(
              {
                error: "Error creating subscription",
                details: insertError.message,
              },
              { status: 500 },
            )
          }

          console.log("🎉 Suscripción creada exitosamente:", newSubscription)

          return NextResponse.json({
            success: true,
            subscription: newSubscription,
            message: "Suscripción creada correctamente",
          })
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("💰 Pago exitoso:", {
          subscription: invoice.subscription,
          amount: invoice.amount_paid,
        })

        if (invoice.subscription) {
          const { planType, bicycleLimit } = getPlanFromAmount(invoice.amount_paid || 0)

          console.log("🔄 Actualizando suscripción por pago exitoso:", {
            stripeSubscriptionId: invoice.subscription,
            planType,
            bicycleLimit,
          })

          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "active",
              plan_type: planType,
              bicycle_limit: bicycleLimit,
              current_period_start: new Date(invoice.period_start * 1000).toISOString(),
              current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string)

          if (error) {
            console.error("❌ Error actualizando suscripción:", error)
            return NextResponse.json({ error: "Error updating subscription" }, { status: 500 })
          }

          console.log("✅ Suscripción actualizada con plan:", planType)
        }
        break
      }

      default:
        console.log("ℹ️ Evento no manejado:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Error procesando webhook:", error)
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
