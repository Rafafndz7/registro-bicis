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

    console.log("📝 Datos recibidos:", { userId, serialNumber, brand, model, bikeType })

    // Validar datos obligatorios
    if (!serialNumber || !brand || !model || !color || !bikeType) {
      return NextResponse.json({ error: "Faltan datos obligatorios de la bicicleta" }, { status: 400 })
    }

    // Verificar suscripción activa y límite
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("bicycle_limit, plan_type, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)

    console.log("🔍 Suscripciones encontradas:", subscriptions)

    if (subError) {
      console.error("❌ Error al buscar suscripción:", subError)
      return NextResponse.json({ error: "Error al verificar suscripción" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: "No tienes una suscripción activa" }, { status: 400 })
    }

    const subscription = subscriptions[0]
    console.log("✅ Suscripción activa:", subscription)

    // Contar bicicletas actuales del usuario
    const { count: bicycleCount, error: countError } = await supabase
      .from("bicycles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) {
      console.error("❌ Error al contar bicicletas:", countError)
      throw countError
    }

    console.log("🚲 Bicicletas actuales:", bicycleCount, "Límite:", subscription.bicycle_limit)

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

    // Registrar la bicicleta
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
        theft_status: "active",
      })
      .select()
      .single()

    if (bicycleError) {
      console.error("❌ Error al registrar bicicleta:", bicycleError)
      throw bicycleError
    }

    console.log("✅ Bicicleta registrada:", bicycle.id)

    // Guardar las imágenes (máximo 4)
    if (images.length > 0 && bicycle) {
      const validImages = images.slice(0, 4) // Limitar a 4 imágenes

      const imageInserts = validImages.map((imageUrl: string) => ({
        bicycle_id: bicycle.id,
        image_url: imageUrl,
      }))

      const { error: imagesError } = await supabase.from("bicycle_images").insert(imageInserts)

      if (imagesError) {
        console.error("⚠️ Error al guardar imágenes:", imagesError)
        // No fallar por las imágenes, solo registrar el error
      } else {
        console.log("✅ Imágenes guardadas:", validImages.length)
      }
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
    console.error("💥 Error general al registrar bicicleta:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
