import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { location, description, policeReportNumber } = await request.json()

    // Validar datos
    if (!location || !description) {
      return NextResponse.json({ error: "Ubicación y descripción son obligatorios" }, { status: 400 })
    }

    // Verificar que la bicicleta pertenezca al usuario
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("id, theft_status")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (bicycleError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    // Verificar que no esté ya reportada
    if (bicycle.theft_status === "reported_stolen") {
      return NextResponse.json({ error: "Esta bicicleta ya está reportada como robada" }, { status: 400 })
    }

    // Crear reporte de robo
    const { data: theftReport, error: reportError } = await supabase
      .from("theft_reports")
      .insert({
        bicycle_id: params.id,
        user_id: session.user.id,
        location,
        description,
        police_report_number: policeReportNumber || null,
        status: "reported",
      })
      .select()
      .single()

    if (reportError) {
      throw reportError
    }

    // Actualizar estado de la bicicleta
    const { error: updateError } = await supabase
      .from("bicycles")
      .update({
        theft_status: "reported_stolen",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: "Bicicleta reportada como robada correctamente",
      reportId: theftReport.id,
    })
  } catch (error) {
    console.error("Error al reportar robo:", error)
    return NextResponse.json({ error: "Error al reportar robo" }, { status: 500 })
  }
}
