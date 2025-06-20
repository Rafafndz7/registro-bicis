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

    // Verificar que la bicicleta pertenece al usuario
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("id, user_id")
      .eq("id", bicycleId)
      .eq("user_id", user.id)
      .single()

    if (bicycleError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get("invoice") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

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

    // Verificar que el bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error checking buckets:", bucketsError)
      return NextResponse.json(
        {
          error: "Error verificando almacenamiento",
        },
        { status: 500 },
      )
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === "bicycle-invoices")

    if (!bucketExists) {
      console.error("Bucket 'bicycle-invoices' does not exist")
      return NextResponse.json(
        {
          error: "El bucket de almacenamiento no existe. Contacta al administrador.",
        },
        { status: 500 },
      )
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split(".").pop()
    const fileName = `${user.id}/${bicycleId}-${Date.now()}.${fileExtension}`

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("bicycle-invoices")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError)
      return NextResponse.json(
        {
          error: "Error al subir archivo: " + uploadError.message,
        },
        { status: 500 },
      )
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage.from("bicycle-invoices").getPublicUrl(fileName)

    // Eliminar factura anterior si existe
    const { error: deleteOldError } = await supabase
      .from("bicycle_invoices")
      .delete()
      .eq("bicycle_id", bicycleId)
      .eq("user_id", user.id)

    if (deleteOldError) {
      console.warn("Error deleting old invoice:", deleteOldError)
    }

    // Guardar información del archivo en la base de datos
    const { data: invoiceData, error: dbError } = await supabase
      .from("bicycle_invoices")
      .insert({
        bicycle_id: bicycleId,
        user_id: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (dbError) {
      // Si falla la inserción en DB, eliminar archivo subido
      await supabase.storage.from("bicycle-invoices").remove([fileName])

      console.error("Database error:", dbError)
      return NextResponse.json(
        {
          error: "Error al guardar información de la factura: " + dbError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Factura subida exitosamente",
      invoice: invoiceData,
    })
  } catch (error) {
    console.error("Error en POST /api/bicycles/[id]/invoice:", error)
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
      return NextResponse.json(
        {
          error: "Error al obtener facturas",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ invoices })
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

    // Extraer el nombre del archivo de la URL
    const fileName = invoice.file_url.split("/").pop()?.split("?")[0]

    if (fileName) {
      // Eliminar archivo de storage
      const { error: storageError } = await supabase.storage.from("bicycle-invoices").remove([`${user.id}/${fileName}`])

      if (storageError) {
        console.warn("Error deleting file from storage:", storageError)
      }
    }

    // Eliminar de base de datos
    const { error: deleteError } = await supabase
      .from("bicycle_invoices")
      .delete()
      .eq("bicycle_id", bicycleId)
      .eq("user_id", user.id)

    if (deleteError) {
      return NextResponse.json(
        {
          error: "Error al eliminar factura de la base de datos",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Factura eliminada correctamente",
    })
  } catch (error) {
    console.error("Error en DELETE /api/bicycles/[id]/invoice:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
