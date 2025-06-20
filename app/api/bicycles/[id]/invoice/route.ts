import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - Obtener factura de una bicicleta
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que la bicicleta pertenezca al usuario
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (bicycleError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    // Obtener factura
    const { data: invoice, error: invoiceError } = await supabase
      .from("bicycle_invoices")
      .select("*")
      .eq("bicycle_id", params.id)
      .single()

    if (invoiceError && invoiceError.code !== "PGRST116") {
      throw invoiceError
    }

    return NextResponse.json({ invoice: invoice || null })
  } catch (error) {
    console.error("Error al obtener factura:", error)
    return NextResponse.json({ error: "Error al obtener factura" }, { status: 500 })
  }
}

// POST - Subir factura
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que la bicicleta pertenezca al usuario
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (bicycleError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("invoice") as File

    if (!file) {
      return NextResponse.json({ error: "Se requiere un archivo" }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido. Solo PDF, JPG, PNG" }, { status: 400 })
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 5MB" }, { status: 400 })
    }

    // Subir archivo a Supabase Storage
    const fileName = `${session.user.id}/${params.id}/invoice-${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("bicycle-invoices")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Error subiendo archivo:", uploadError)
      throw uploadError
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage.from("bicycle-invoices").getPublicUrl(uploadData.path)

    // Eliminar factura anterior si existe
    const { error: deleteError } = await supabase.from("bicycle_invoices").delete().eq("bicycle_id", params.id)

    if (deleteError) {
      console.error("Error eliminando factura anterior:", deleteError)
    }

    // Guardar en base de datos
    const { data: invoice, error: invoiceError } = await supabase
      .from("bicycle_invoices")
      .insert({
        bicycle_id: params.id,
        user_id: session.user.id,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (invoiceError) {
      throw invoiceError
    }

    return NextResponse.json({
      success: true,
      message: "Factura subida correctamente",
      invoice,
    })
  } catch (error) {
    console.error("Error al subir factura:", error)
    return NextResponse.json({ error: "Error al subir factura" }, { status: 500 })
  }
}

// DELETE - Eliminar factura
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener factura para eliminar archivo
    const { data: invoice, error: getError } = await supabase
      .from("bicycle_invoices")
      .select("*")
      .eq("bicycle_id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (getError || !invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    // Eliminar archivo de storage
    const filePath = invoice.file_url.split("/").pop()
    if (filePath) {
      await supabase.storage.from("bicycle-invoices").remove([`${session.user.id}/${params.id}/${filePath}`])
    }

    // Eliminar de base de datos
    const { error: deleteError } = await supabase
      .from("bicycle_invoices")
      .delete()
      .eq("bicycle_id", params.id)
      .eq("user_id", session.user.id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: "Factura eliminada correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar factura:", error)
    return NextResponse.json({ error: "Error al eliminar factura" }, { status: 500 })
  }
}
