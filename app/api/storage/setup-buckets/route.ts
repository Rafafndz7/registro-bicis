import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación de admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario es admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden ejecutar esto" }, { status: 403 })
    }

    console.log("🔧 Configurando buckets de almacenamiento...")

    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("❌ Error listing buckets:", listError)
      return NextResponse.json({ error: "Error al listar buckets: " + listError.message }, { status: 500 })
    }

    console.log(
      "📦 Buckets existentes:",
      buckets?.map((b) => b.name),
    )

    const requiredBuckets = ["bicycle-images"]
    const results = []

    for (const bucketName of requiredBuckets) {
      const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

      if (!bucketExists) {
        console.log(`🆕 Creando bucket: ${bucketName}`)

        const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
          fileSizeLimit: 5242880, // 5MB
        })

        if (createError) {
          console.error(`❌ Error creating bucket ${bucketName}:`, createError)
          results.push({
            bucket: bucketName,
            status: "error",
            message: createError.message,
          })
        } else {
          console.log(`✅ Bucket ${bucketName} creado exitosamente`)
          results.push({
            bucket: bucketName,
            status: "created",
            message: "Bucket creado exitosamente",
          })
        }
      } else {
        console.log(`✅ Bucket ${bucketName} ya existe`)
        results.push({
          bucket: bucketName,
          status: "exists",
          message: "Bucket ya existe",
        })
      }
    }

    return NextResponse.json({
      message: "Configuración de buckets completada",
      results,
    })
  } catch (error) {
    console.error("💥 Error general:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
