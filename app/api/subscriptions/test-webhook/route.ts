import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, amount } = await request.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: "userId y amount son requeridos" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Función para determinar el plan basado en el precio
    function getPlanFromAmount(amount: number): { planType: string; bicycleLimit: number } {
      switch (amount) {
        case 4000:
          return { planType: "básico", bicycleLimit: 1 }
        case 6000:
          return { planType: "estándar", bicycleLimit: 2 }
        case 12000:
          return { planType: "familiar", bicycleLimit: 4 }
        case 18000:
          return { planType: "premium", bicycleLimit: 6 }
        default:
          return { planType: "básico", bicycleLimit: 1 }
      }
    }

    const { planType, bicycleLimit } = getPlanFromAmount(amount)

    console.log("🧪 Test webhook - creando suscripción:", {
      userId,
      amount,
      planType,
      bicycleLimit,
    })

    // Cancelar suscripciones anteriores
    await supabase.from("subscriptions").update({ status: "canceled" }).eq("user_id", userId).neq("status", "canceled")

    // Crear nueva suscripción
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: `test_sub_${Date.now()}`,
      stripe_customer_id: `test_cus_${Date.now()}`,
      status: "active",
      plan_type: planType,
      bicycle_limit: bicycleLimit,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    const { data: newSubscription, error } = await supabase
      .from("subscriptions")
      .insert(subscriptionData)
      .select()
      .single()

    if (error) {
      console.error("❌ Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Suscripción de prueba creada:", newSubscription)

    return NextResponse.json({
      success: true,
      subscription: newSubscription,
      message: "Suscripción de prueba creada correctamente",
    })
  } catch (error) {
    console.error("❌ Error en test webhook:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
