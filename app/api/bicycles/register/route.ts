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

    const userId = session.user.id
    const formData = await request.json()
    const { serialNumber, brand, model, color, characteristics, images = [] } = formData

    // Validar datos
    if (!serialNumber || !brand || !model || !color) {
      return NextResponse.json({ error: "Faltan datos obligatorios de la bicicleta" }, { status: 400 })
    }

    // Verificar límite de 2 bicicletas por usuario
    const { count: bicycleCount, error: countError } = await supabase
      .from("bicycles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) throw countError

    if (bicycleCount && bicycleCount >= 2) {
      return NextResponse.json(
        { error: "Has alcanzado el límite máximo de 2 bicicletas registradas por usuario" },
        { status: 400 },
      )
    }

    // Verificar que no exista una bicicleta con el mismo número de serie
    const { data: existingBicycle } = await supabase
      .from("bicycles")
      .select("id")
      .eq("serial_number", serialNumber)
      .single()

    if (existingBicycle) {
      return NextResponse.json(
        { error: "Ya existe una bicicleta registrada con este número de serie" },
        { status: 400 },
      )
    }

    // 1. Registrar la bicicleta
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .insert({
        user_id: userId,
        serial_number: serialNumber,
        brand,
        model,
        color,
        characteristics,
      })
      .select()
      .single()

    if (bicycleError) throw bicycleError

    // 2. Guardar las imágenes (máximo 4)
    if (images.length > 0 && bicycle) {
      const validImages = images.slice(0, 4) // Limitar a 4 imágenes

      const imageInserts = validImages.map((imageUrl) => ({
        bicycle_id: bicycle.id,
        image_url: imageUrl,
      }))

      const { error: imagesError } = await supabase.from("bicycle_images").insert(imageInserts)

      if (imagesError) throw imagesError
    }

    // 3. Crear registro de pago pendiente
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: userId,
      bicycle_id: bicycle.id,
      amount: 25000, // $250 MXN en centavos para Stripe
      payment_status: "pending",
    })

    if (paymentError) throw paymentError

    return NextResponse.json(
      {
        success: true,
        message: "Bicicleta registrada correctamente. Pendiente de pago.",
        bicycleId: bicycle.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error al registrar bicicleta:", error)
    return NextResponse.json({ error: "Error al registrar bicicleta", details: error }, { status: 500 })
  }
}
