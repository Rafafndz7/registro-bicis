import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.json()
  const { email, password, fullName, birthDate, phone } = formData

  console.log("=== INICIO REGISTRO ===")
  console.log("Datos recibidos:", { email, fullName, birthDate, phone })

  // Validar datos
  if (!email || !password || !fullName || !birthDate || !phone) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Crear usuario en auth
    console.log("1. Creando usuario en auth...")
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${requestUrl.origin}/auth/callback`,
        data: {
          full_name: fullName,
          birth_date: birthDate,
          phone: phone,
        },
      },
    })

    if (authError) {
      console.error("Error en signUp:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    console.log("2. Usuario creado en auth:", authData.user?.id)

    // Insertar perfil
    if (authData?.user?.id) {
      console.log("3. Insertando perfil en base de datos...")

      const profileData = {
        id: authData.user.id,
        full_name: fullName,
        birth_date: birthDate,
        email,
        phone,
        role: "user",
        curp: null, // Usar null en lugar de string vacío
        address: "",
      }

      console.log("Datos del perfil a insertar:", profileData)

      const { data: insertedProfile, error: profileError } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        console.error("Error al insertar perfil:", profileError)
        return NextResponse.json(
          {
            error: `Error al crear perfil: ${profileError.message}`,
            details: profileError,
          },
          { status: 400 },
        )
      }

      console.log("4. Perfil insertado exitosamente:", insertedProfile)

      // Verificar que el perfil se insertó correctamente
      const { data: verifyProfile, error: verifyError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (verifyError) {
        console.error("Error al verificar perfil:", verifyError)
      } else {
        console.log("5. Perfil verificado:", verifyProfile)
      }
    }

    console.log("=== REGISTRO COMPLETADO ===")

    return NextResponse.json(
      {
        success: true,
        message: "Usuario registrado correctamente.",
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
