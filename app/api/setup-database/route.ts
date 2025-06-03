import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Verificar si existe la tabla de suscripciones
    const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
      table_name: "subscriptions",
    })

    if (tableError) {
      return NextResponse.json({ error: "Error al verificar tabla", details: tableError }, { status: 500 })
    }

    // Si la tabla no existe, crearla
    if (!tableExists) {
      const { error: createError } = await supabase.rpc("create_subscriptions_table")

      if (createError) {
        return NextResponse.json({ error: "Error al crear tabla", details: createError }, { status: 500 })
      }
    }

    // Verificar políticas RLS
    const { data: policies, error: policiesError } = await supabase.rpc("get_table_policies", {
      table_name: "subscriptions",
    })

    if (policiesError) {
      return NextResponse.json({ error: "Error al verificar políticas", details: policiesError }, { status: 500 })
    }

    // Crear políticas si no existen
    if (!policies || policies.length === 0) {
      const { error: policyError } = await supabase.rpc("create_subscription_policies")

      if (policyError) {
        return NextResponse.json({ error: "Error al crear políticas", details: policyError }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Base de datos configurada correctamente",
      details: {
        tableExists,
        policies,
      },
    })
  } catch (error) {
    console.error("Error al configurar base de datos:", error)
    return NextResponse.json({ error: "Error al configurar base de datos", details: error }, { status: 500 })
  }
}
