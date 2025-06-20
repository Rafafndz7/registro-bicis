import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const bicycleId = params.id
    const { location, description, policeReportNumber } = await request.json()

    // Validar datos requeridos
    if (!location || !description) {
      return NextResponse.json(
        {
          error: "Ubicación y descripción son requeridas",
        },
        { status: 400 },
      )
    }

    // Verificar que la bicicleta pertenece al usuario y no está ya reportada
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("id, user_id, theft_status, brand, model, serial_number")
      .eq("id", bicycleId)
      .eq("user_id", user.id)
      .single()

    if (bicycleError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    if (bicycle.theft_status === "reported_stolen") {
      return NextResponse.json(
        {
          error: "Esta bicicleta ya está reportada como robada",
        },
        { status: 400 },
      )
    }

    // Iniciar transacción: crear reporte y actualizar estado
    const { data: theftReport, error: reportError } = await supabase
      .from("theft_reports")
      .insert({
        bicycle_id: bicycleId,
        user_id: user.id,
        location: location.trim(),
        description: description.trim(),
        police_report_number: policeReportNumber?.trim() || null,
      })
      .select()
      .single()

    if (reportError) {
      console.error("Error creating theft report:", reportError)
      return NextResponse.json(
        {
          error: "Error al crear reporte de robo",
        },
        { status: 500 },
      )
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
      console.error("Error updating bicycle status:", updateError)
      // Intentar eliminar el reporte si falla la actualización
      await supabase.from("theft_reports").delete().eq("id", theftReport.id)

      return NextResponse.json(
        {
          error: "Error al actualizar estado de la bicicleta",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Robo reportado exitosamente",
      report: theftReport,
      bicycle: {
        brand: bicycle.brand,
        model: bicycle.model,
        serial_number: bicycle.serial_number,
      },
    })
  } catch (error) {
    console.error("Error en POST /api/bicycles/[id]/report-theft:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const bicycleId = params.id

    // Obtener reportes de robo de la bicicleta
    const { data: reports, error } = await supabase
      .from("theft_reports")
      .select("*")
      .eq("bicycle_id", bicycleId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        {
          error: "Error al obtener reportes de robo",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Error en GET /api/bicycles/[id]/report-theft:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
