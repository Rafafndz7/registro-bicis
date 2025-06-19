import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { email, password, fullName, adminKey } = await request.json()

    // Verificar clave de admin (puedes cambiar esta clave)
    const ADMIN_SETUP_KEY = "RNB_ADMIN_SETUP_2024"
    if (adminKey !== ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: "Clave de administrador incorrecta" }, { status: 401 })
    }

    // Verificar si ya existe un admin
    const { data: existingAdmin } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1)

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json({ error: "Ya existe un administrador en el sistema" }, { status: 400 })
    }

    // Crear usuario admin
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    if (authData.user) {
      // Actualizar perfil como admin
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          role: "admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id)

      if (profileError) throw profileError

      return NextResponse.json({
        success: true,
        message: "Administrador creado exitosamente",
        user: authData.user,
      })
    }

    throw new Error("Error al crear usuario")
  } catch (error) {
    console.error("Error al crear admin:", error)
    return NextResponse.json({ error: "Error al crear administrador" }, { status: 500 })
  }
}
