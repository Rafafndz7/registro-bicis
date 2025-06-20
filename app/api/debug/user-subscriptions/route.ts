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

    // Obtener todas las suscripciones del usuario actual
    const { data: userSubscriptions, error: userSubError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Obtener información del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    // Obtener todas las suscripciones (para debug admin)
    const { data: allSubscriptions, error: allSubError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email,
        profile: userProfile,
      },
      userSubscriptions: {
        count: userSubscriptions?.length || 0,
        subscriptions: userSubscriptions,
        error: userSubError?.message,
      },
      allSubscriptions: {
        count: allSubscriptions?.length || 0,
        subscriptions: allSubscriptions,
        error: allSubError?.message,
      },
    })
  } catch (error) {
    console.error("Error en debug user subscriptions:", error)
    return NextResponse.json({
      error: "Error interno",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
