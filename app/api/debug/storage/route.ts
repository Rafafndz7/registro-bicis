import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
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

    // Listar buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        error: "Error listando buckets",
        details: bucketsError,
      })
    }

    // Verificar bucket específico
    const bicycleBucket = buckets?.find((b) => b.name === "bicycle-invoices")

    // Intentar listar archivos en el bucket
    let filesInBucket = null
    let listError = null

    if (bicycleBucket) {
      const { data: files, error } = await supabase.storage.from("bicycle-invoices").list(user.id, { limit: 10 })

      filesInBucket = files
      listError = error
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      buckets: buckets?.map((b) => ({
        name: b.name,
        public: b.public,
        file_size_limit: b.file_size_limit,
        allowed_mime_types: b.allowed_mime_types,
      })),
      bicycleBucket,
      filesInBucket,
      listError,
    })
  } catch (error) {
    console.error("Error en debug storage:", error)
    return NextResponse.json({
      error: "Error interno",
      details: error,
    })
  }
}
