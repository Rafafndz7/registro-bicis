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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const bicycleId = formData.get("bicycleId") as string

    if (!file || !bicycleId) {
      return NextResponse.json({ error: "Se requiere un archivo y el ID de la bicicleta" }, { status: 400 })
    }

    // Verificar que la bicicleta pertenezca al usuario
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("id")
      .eq("id", bicycleId)
      .eq("user_id", session.user.id)
      .single()

    if (bicycleError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada o no pertenece al usuario" }, { status: 404 })
    }

    // Verificar que no haya más de 4 imágenes
    const { count, error: countError } = await supabase
      .from("bicycle_images")
      .select("id", { count: "exact" })
      .eq("bicycle_id", bicycleId)

    if (countError) throw countError

    if (count && count >= 4) {
      return NextResponse.json({ error: "Ya se ha alcanzado el límite de 4 imágenes por bicicleta" }, { status: 400 })
    }

    // Subir imagen a Supabase Storage
    const fileName = `${session.user.id}/${bicycleId}/${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("bicycle-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Obtener URL pública de la imagen
    const { data: publicUrlData } = supabase.storage.from("bicycle-images").getPublicUrl(uploadData.path)

    // Guardar referencia en la base de datos
    const { error: imageError } = await supabase.from("bicycle_images").insert({
      bicycle_id: bicycleId,
      image_url: publicUrlData.publicUrl,
    })

    if (imageError) throw imageError

    return NextResponse.json(
      {
        success: true,
        message: "Imagen subida correctamente",
        imageUrl: publicUrlData.publicUrl,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error al subir imagen:", error)
    return NextResponse.json({ error: "Error al subir imagen", details: error }, { status: 500 })
  }
}
