import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
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

    console.log("🔍 Verificando configuración de storage...")

    // 1. Verificar buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        error: "Error obteniendo buckets",
        details: bucketsError,
      })
    }

    const bicycleBucket = buckets?.find((b) => b.name === "bicycle-invoices")

    // 2. Verificar políticas
    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "objects")
      .like("policyname", "%invoice%")

    // 3. Probar acceso al bucket
    let bucketAccess = null
    try {
      const { data: files, error: listError } = await supabase.storage
        .from("bicycle-invoices")
        .list(user.id, { limit: 1 })

      bucketAccess = {
        success: !listError,
        error: listError?.message,
        canList: true,
      }
    } catch (error: any) {
      bucketAccess = {
        success: false,
        error: error.message,
        canList: false,
      }
    }

    // 4. Verificar RLS
    const { data: rlsStatus, error: rlsError } = await supabase
      .from("pg_tables")
      .select("*")
      .eq("tablename", "objects")
      .eq("schemaname", "storage")

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      bucket: {
        exists: !!bicycleBucket,
        config: bicycleBucket,
        totalBuckets: buckets?.length || 0,
      },
      policies: {
        found: policies?.length || 0,
        details: policies,
        error: policiesError?.message,
      },
      access: bucketAccess,
      rls: {
        data: rlsStatus,
        error: rlsError?.message,
      },
    })
  } catch (error) {
    console.error("Error en debug storage:", error)
    return NextResponse.json({
      error: "Error interno",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
