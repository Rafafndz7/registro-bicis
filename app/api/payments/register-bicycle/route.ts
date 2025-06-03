import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Verificar autenticación
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { brand, model, color, serialNumber, bicycleType, description, purchaseDate, purchasePrice, images } = body

    // Validar datos requeridos
    if (!brand || !model || !color || !serialNumber || !bicycleType) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar si ya existe una bicicleta con ese número de serie
    const { data: existingBicycle } = await supabase
      .from("bicycles")
      .select("id")
      .eq("serial_number", serialNumber)
      .single()

    if (existingBicycle) {
      return NextResponse.json({ error: "Ya existe una bicicleta registrada con ese número de serie" }, { status: 400 })
    }

    // Crear registro de bicicleta
    const bicycleData = {
      user_id: user.id,
      brand,
      model,
      color,
      serial_number: serialNumber,
      bicycle_type: bicycleType,
      description: description || null,
      purchase_date: purchaseDate || null,
      purchase_price: purchasePrice ? Number.parseFloat(purchasePrice) : null,
      images: images || [],
      status: "active",
      is_stolen: false,
      created_at: new Date().toISOString(),
    }

    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .insert([bicycleData])
      .select()
      .single()

    if (bicycleError) {
      console.error("Error creating bicycle:", bicycleError)
      return NextResponse.json({ error: "Error al registrar la bicicleta" }, { status: 500 })
    }

    // Crear registro de pago
    const paymentData = {
      user_id: user.id,
      bicycle_id: bicycle.id,
      amount: 50.0, // Precio fijo por registro
      currency: "MXN",
      status: "pending",
      created_at: new Date().toISOString(),
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([paymentData])
      .select()
      .single()

    if (paymentError) {
      console.error("Error creating payment:", paymentError)
      // Eliminar la bicicleta si no se pudo crear el pago
      await supabase.from("bicycles").delete().eq("id", bicycle.id)
      return NextResponse.json({ error: "Error al crear el registro de pago" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bicycle,
      payment,
      message: "Bicicleta registrada exitosamente",
    })
  } catch (error) {
    console.error("Error in register-bicycle API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
