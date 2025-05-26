import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

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

    const { bicycleId, location, description, policeReportNumber } = await request.json()

    if (!bicycleId) {
      return NextResponse.json({ error: "Se requiere el ID de la bicicleta" }, { status: 400 })
    }

    // Verificar que la bicicleta pertenezca al usuario
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("id, theft_status")
      .eq("id", bicycleId)
      .eq("user_id", session.user.id)
      .single()

    if (bicycleError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    if (bicycle.theft_status === "reported_stolen") {
      return NextResponse.json({ error: "Esta bicicleta ya está reportada como robada" }, { status: 400 })
    }

    // Crear reporte de robo
    const { data: theftReport, error: reportError } = await supabase
      .from("theft_reports")
      .insert({
        bicycle_id: bicycleId,
        user_id: session.user.id,
        location,
        description,
        police_report_number: policeReportNumber,
        status: "reported",
      })
      .select()
      .single()

    if (reportError) {
      return NextResponse.json({ error: "Error al crear reporte de robo" }, { status: 500 })
    }

    // Actualizar estado de la bicicleta
    const { error: updateError } = await supabase
      .from("bicycles")
      .update({
        theft_status: "reported_stolen",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bicycleId)

    if (updateError) {
      return NextResponse.json({ error: "Error al actualizar estado de la bicicleta" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Reporte de robo creado exitosamente",
      report: theftReport,
    })
  } catch (error) {
    console.error("Error al crear reporte de robo:", error)
    return NextResponse.json({ error: "Error al crear reporte de robo" }, { status: 500 })
  }
}
