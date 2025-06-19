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
    const {
      serialNumber,
      brand,
      model,
      color,
      bikeType,
      year,
      wheelSize,
      groupset,
      characteristics,
      images = [],
    } = formData

    // Validar datos obligatorios
    if (!serialNumber || !brand || !model || !color || !bikeType) {
      return NextResponse.json({ error: "Faltan datos obligatorios de la bicicleta" }, { status: 400 })
    }

    // Verificar suscripción activa y límite
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("bicycle_limit, plan_type")
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: "No tienes una suscripción activa" }, { status: 400 })
    }

    // Contar bicicletas actuales del usuario
    const { count: bicycleCount, error: countError } = await supabase
      .from("bicycles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) throw countError

    if (bicycleCount && bicycleCount >= subscription.bicycle_limit) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${subscription.bicycle_limit} bicicleta${subscription.bicycle_limit > 1 ? "s" : ""} de tu plan ${subscription.plan_type}`,
        },
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

    // 1. Registrar la bicicleta con los nuevos campos
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .insert({
        user_id: userId,
        serial_number: serialNumber,
        brand,
        model,
        color,
        bike_type: bikeType,
        year: year || null,
        wheel_size: wheelSize || null,
        groupset: groupset || null,
        characteristics,
        payment_status: true, // Automáticamente pagado con suscripción
      })
      .select()
      .single()

    if (bicycleError) throw bicycleError

    // 2. Guardar las imágenes (máximo 4)
    if (images.length > 0 && bicycle) {
      const validImages = images.slice(0, 4) // Limitar a 4 imágenes

      const imageInserts = validImages.map((imageUrl: string) => ({
        bicycle_id: bicycle.id,
        image_url: imageUrl,
      }))

      const { error: imagesError } = await supabase.from("bicycle_images").insert(imageInserts)

      if (imagesError) throw imagesError
    }

    return NextResponse.json(
      {
        success: true,
        message: "Bicicleta registrada correctamente.",
        bicycleId: bicycle.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error al registrar bicicleta:", error)
    return NextResponse.json({ error: "Error al registrar bicicleta", details: error }, { status: 500 })
  }
}
