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
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("✅ Usuario autenticado:", user.id)

    const bicycleId = params.id

    // Verificar que la bicicleta pertenece al usuario
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("id, user_id")
      .eq("id", bicycleId)
      .eq("user_id", user.id)
      .single()

    if (bicycleError || !bicycle) {
      console.error("Bicycle error:", bicycleError)
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    console.log("✅ Bicicleta encontrada:", bicycle.id)

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get("invoice") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    console.log("✅ Archivo recibido:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Validar tipo de archivo
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Tipo de archivo no permitido. Solo PDF, JPG, PNG",
        },
        { status: 400 },
      )
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "Archivo demasiado grande. Máximo 5MB",
        },
        { status: 400 },
      )
    }

    // USAR EL MISMO BUCKET QUE LAS IMÁGENES (que ya funciona perfectamente)
    const bucketName = "bicycle-images"

    // Generar nombre único para el archivo (en carpeta de facturas)
    const fileExtension = file.name.split(".").pop()
    const fileName = `invoice-${Date.now()}.${fileExtension}`
    const filePath = `${user.id}/${bicycleId}/invoices/${fileName}`

    console.log("📁 Subiendo factura a:", filePath)

    // Subir archivo a Supabase Storage (MISMO BUCKET que las imágenes)
    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("❌ Error uploading to storage:", uploadError)
      return NextResponse.json(
        {
          error: "Error al subir archivo: " + uploadError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Archivo subido:", uploadData.path)

    // Obtener URL pública del archivo (IGUAL que las imágenes)
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    console.log("🔗 URL pública:", urlData.publicUrl)

    // Eliminar factura anterior si existe
    const { error: deleteOldError } = await supabase
      .from("bicycle_invoices")
      .delete()
      .eq("bicycle_id", bicycleId)
      .eq("user_id", user.id)

    if (deleteOldError) {
      console.warn("⚠️ Error deleting old invoice:", deleteOldError)
    }

    // Guardar información del archivo en la base de datos (IGUAL que las imágenes)
    const { data: invoiceData, error: dbError } = await supabase
      .from("bicycle_invoices")
      .insert({
        bicycle_id: bicycleId,
        user_id: user.id,
        original_filename: file.name, // Usar original_filename en lugar de file_name
        invoice_url: urlData.publicUrl, // Usar invoice_url en lugar de file_url
        file_size: file.size,
        mime_type: file.type,
        upload_date: new Date().toISOString(), // Agregar upload_date
      })
      .select()
      .single()

    if (dbError) {
      console.error("❌ Database error:", dbError)
      // Si falla la inserción en DB, eliminar archivo subido
      await supabase.storage.from(bucketName).remove([filePath])

      return NextResponse.json(
        {
          error: "Error al guardar información de la factura: " + dbError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Factura guardada en DB:", invoiceData.id)

    return NextResponse.json({
      message: "Factura subida exitosamente",
      invoice: invoiceData,
    })
  } catch (error) {
    console.error("💥 Error general:", error)
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

    // Obtener facturas de la bicicleta
    const { data: invoices, error } = await supabase
      .from("bicycle_invoices")
      .select("*")
      .eq("bicycle_id", bicycleId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error getting invoices:", error)
      return NextResponse.json(
        {
          error: "Error al obtener facturas: " + error.message,
        },
        { status: 500 },
      )
    }

    // Si hay facturas, devolver la primera (más reciente)
    const invoice = invoices && invoices.length > 0 ? invoices[0] : null

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Error en GET /api/bicycles/[id]/invoice:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Obtener factura para eliminar archivo
    const { data: invoice, error: getError } = await supabase
      .from("bicycle_invoices")
      .select("*")
      .eq("bicycle_id", bicycleId)
      .eq("user_id", user.id)
      .single()

    if (getError || !invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    // Extraer el path del archivo de la URL (IGUAL que las imágenes)
    const bucketName = "bicycle-images"
    const pathParts = invoice.file_url.split(`${bucketName}/`)[1]?.split("?")[0]
    const filePath = pathParts

    console.log("🗑️ Eliminando archivo:", filePath)

    if (filePath) {
      // Eliminar archivo de storage (MISMO BUCKET que las imágenes)
      const { error: storageError } = await supabase.storage.from(bucketName).remove([filePath])

      if (storageError) {
        console.warn("⚠️ Error deleting file from storage:", storageError)
      } else {
        console.log("✅ Archivo eliminado del storage")
      }
    }

    // Eliminar de base de datos
    const { error: deleteError } = await supabase
      .from("bicycle_invoices")
      .delete()
      .eq("bicycle_id", bicycleId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("❌ Error deleting from DB:", deleteError)
      return NextResponse.json(
        {
          error: "Error al eliminar factura de la base de datos",
        },
        { status: 500 },
      )
    }

    console.log("✅ Factura eliminada de la DB")

    return NextResponse.json({
      message: "Factura eliminada correctamente",
    })
  } catch (error) {
    console.error("💥 Error en DELETE:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
