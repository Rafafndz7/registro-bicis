import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.json()
  const { email, password, fullName, birthDate, curp, address, phone } = formData

  // Validar datos
  if (!email || !password || !fullName || !birthDate || !curp || !address || !phone) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${requestUrl.origin}/auth/callback`,
      },
    })

    if (authError) {
      console.error("Error en signUp:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Insertar perfil
    if (authData?.user?.id) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        full_name: fullName,
        birth_date: birthDate,
        email,
        curp,
        address,
        phone,
        role: "user",
      })

      if (profileError) {
        console.error("Error al insertar perfil:", profileError)
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Usuario registrado correctamente. Por favor verifica tu correo electrónico.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error inesperado al registrar usuario:", error)

    let errorMessage = "Error al registrar usuario"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
