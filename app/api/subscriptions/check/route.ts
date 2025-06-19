import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 Verificando suscripción para usuario:", session.user.id)

    // Buscar suscripción activa
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("❌ Error al buscar suscripción:", error)
      throw error
    }

    const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null

    console.log("📊 Suscripción encontrada:", subscription)

    return NextResponse.json({
      hasActiveSubscription: !!subscription,
      subscription: subscription || null,
    })
  } catch (error) {
    console.error("💥 Error al verificar suscripción:", error)
    return NextResponse.json({ error: "Error al verificar suscripción" }, { status: 500 })
  }
}
