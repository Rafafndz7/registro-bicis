import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createServerClient } from "@/lib/supabase-server"
import { z } from "zod"

const resend = new Resend(process.env.RESEND_API_KEY!)

const resetPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = resetPasswordSchema.parse(body)

    const supabase = createServerClient()

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("email", email)
      .single()

    if (userError || !user) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json({
        success: true,
        message: "Si el correo existe, recibirás un enlace de recuperación.",
      })
    }

    // Generar token de recuperación con Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `https://www.registronacionaldebicicletas.com/auth/reset-password/confirm`,
      },
    })

    if (error) {
      console.error("Error generando enlace:", error)
      throw error
    }

    // Enviar email personalizado con Resend
    const resetUrl = data.properties?.action_link

    if (!resetUrl) {
      throw new Error("No se pudo generar el enlace de recuperación")
    }

    const emailHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale: 1.0">
      <title>Recuperar contraseña - Registro Nacional de Bicis</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚴‍♂️ Registro Nacional de Bicis</h1>
        <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">www.registronacionaldebicicletas.com</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #495057; margin-top: 0;">Recuperar tu contraseña</h2>
        
        <p>Hola <strong>${user.full_name}</strong>,</p>
        
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Registro Nacional de Bicis.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Cambiar mi contraseña
          </a>
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">
          <strong>Importante:</strong> Este enlace expirará en 1 hora por seguridad.
        </p>
        
        <p style="color: #6c757d; font-size: 14px;">
          Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.
        </p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="color: #6c757d; font-size: 12px; text-align: center;">
          Este correo fue enviado por <strong>Registro Nacional de Bicis</strong><br>
          Visítanos en: <a href="https://www.registronacionaldebicicletas.com" style="color: #007bff;">www.registronacionaldebicicletas.com</a><br><br>
          Si tienes problemas con el botón, copia y pega este enlace en tu navegador:<br>
          <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    </body>
  </html>
`

    await resend.emails.send({
      from: "Registro Nacional de Bicis <onboarding@resend.dev>",
      to: [email],
      subject: "Recuperar tu contraseña - Registro Nacional de Bicis",
      html: emailHtml,
    })

    return NextResponse.json({
      success: true,
      message: "Se ha enviado un enlace de recuperación a tu correo electrónico.",
    })
  } catch (error: any) {
    console.error("Error en reset password:", error)

    if (error.message?.includes("rate limit")) {
      return NextResponse.json(
        {
          error: "Demasiados intentos. Por favor espera unos minutos.",
        },
        { status: 429 },
      )
    }

    return NextResponse.json(
      {
        error: "Error al procesar la solicitud. Intenta nuevamente.",
      },
      { status: 500 },
    )
  }
}
