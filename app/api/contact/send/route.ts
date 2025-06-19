import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validar datos
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: "Registro Nacional de Bicis <noreply@registronacionaldebicicletas.com>",
      to: ["soporteregistronacionalbicis@gmail.com"],
      subject: `Nuevo mensaje de contacto: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin: 0; font-size: 24px;">📧 Nuevo Mensaje de Contacto</h1>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Información del Contacto</h2>
              <p style="margin: 8px 0; color: #4b5563;"><strong>Nombre:</strong> ${name}</p>
              <p style="margin: 8px 0; color: #4b5563;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0; color: #4b5563;"><strong>Asunto:</strong> ${subject}</p>
              <p style="margin: 8px 0; color: #4b5563;"><strong>Fecha:</strong> ${new Date().toLocaleString("es-MX", {
                timeZone: "America/Mexico_City",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
            </div>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">Mensaje:</h3>
              <p style="color: #1f2937; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Este mensaje fue enviado desde el formulario de contacto de<br>
                <strong>Registro Nacional de Bicicletas</strong>
              </p>
            </div>
          </div>
        </div>
      `,
      replyTo: email,
    })

    if (error) {
      console.error("Error al enviar email:", error)
      return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 })
    }

    console.log("Email enviado exitosamente:", data)
    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error("Error al procesar mensaje de contacto:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
