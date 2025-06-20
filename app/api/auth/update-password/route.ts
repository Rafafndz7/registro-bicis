import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const updatePasswordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = updatePasswordSchema.parse(body)

    const supabase = createRouteHandlerClient({ cookies })

    // Verificar que hay una sesión activa
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        {
          error: "Sesión inválida o expirada. Solicita un nuevo enlace de recuperación.",
        },
        { status: 401 },
      )
    }

    // Actualizar la contraseña
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      console.error("Error actualizando contraseña:", error)

      if (error.message.includes("weak_password")) {
        return NextResponse.json(
          {
            error: "La contraseña es muy débil. Debe tener al menos 8 caracteres con mayúsculas, minúsculas y números.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        {
          error: error.message || "Error al actualizar la contraseña",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    })
  } catch (error: any) {
    console.error("Error en update password:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: error.errors[0]?.message || "Datos inválidos",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
