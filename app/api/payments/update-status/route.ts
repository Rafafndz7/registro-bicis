import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Esta ruta es para actualizar manualmente el estado de pago en entorno de prueba
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

    const { bicycleId, sessionId } = await request.json()
    if (!bicycleId) {
      return NextResponse.json({ error: "Se requiere el ID de la bicicleta" }, { status: 400 })
    }

    // Obtener el pago pendiente
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id")
      .eq("bicycle_id", bicycleId)
      .eq("user_id", session.user.id)
      .eq("payment_status", "pending")
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    // Actualizar el estado del pago
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        payment_status: "completed",
        stripe_payment_id: sessionId || `manual-${Date.now()}`,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)

    if (updatePaymentError) {
      return NextResponse.json({ error: "Error al actualizar pago" }, { status: 500 })
    }

    // Actualizar el estado de la bicicleta
    const { error: updateBicycleError } = await supabase
      .from("bicycles")
      .update({
        payment_status: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bicycleId)
      .eq("user_id", session.user.id)

    if (updateBicycleError) {
      return NextResponse.json({ error: "Error al actualizar bicicleta" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Estado de pago actualizado correctamente" })
  } catch (error) {
    console.error("Error al actualizar estado de pago:", error)
    return NextResponse.json({ error: "Error al actualizar estado de pago" }, { status: 500 })
  }
}
