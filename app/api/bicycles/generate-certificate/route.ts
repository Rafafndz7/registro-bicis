import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const bicycleId = url.searchParams.get("bicycleId")

    if (!bicycleId) {
      return NextResponse.json({ error: "Se requiere el ID de la bicicleta" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos de la bicicleta y el usuario
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select(
        `
        *,
        profiles (
          full_name,
          email,
          curp,
          address,
          phone
        )
      `,
      )
      .eq("id", bicycleId)
      .eq("user_id", session.user.id)
      .eq("payment_status", true)
      .single()

    if (bicycleError || !bicycle) {
      console.error("Error al obtener bicicleta:", bicycleError)
      return NextResponse.json(
        { error: "Bicicleta no encontrada o pago no completado" },
        { status: bicycleError ? 500 : 404 },
      )
    }

    console.log("Generando certificado para:", bicycle.brand, bicycle.model)

    // Crear contenido HTML del certificado
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificado RNB - ${bicycle.brand} ${bicycle.model}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 40px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e88e5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          color: #1e88e5;
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 18px;
          margin-bottom: 5px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          color: #1e88e5;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        .info-row {
          margin-bottom: 10px;
          font-size: 14px;
        }
        .label {
          font-weight: bold;
          color: #333;
        }
        .value {
          color: #666;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
        .verification {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">RNB</div>
        <div class="subtitle">REGISTRO NACIONAL DE BICIS</div>
        <div style="font-size: 16px; color: #666;">Certificado Oficial de Registro</div>
      </div>

      <div class="section">
        <div class="section-title">INFORMACIÓN DE LA BICICLETA</div>
        <div class="info-row">
          <span class="label">Número de Serie:</span> 
          <span class="value">${bicycle.serial_number}</span>
        </div>
        <div class="info-row">
          <span class="label">Marca:</span> 
          <span class="value">${bicycle.brand}</span>
        </div>
        <div class="info-row">
          <span class="label">Modelo:</span> 
          <span class="value">${bicycle.model}</span>
        </div>
        <div class="info-row">
          <span class="label">Color:</span> 
          <span class="value">${bicycle.color}</span>
        </div>
        <div class="info-row">
          <span class="label">Fecha de Registro:</span> 
          <span class="value">${new Date(bicycle.registration_date).toLocaleDateString("es-MX")}</span>
        </div>
        ${
          bicycle.characteristics
            ? `
        <div class="info-row">
          <span class="label">Características:</span> 
          <span class="value">${bicycle.characteristics}</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="section">
        <div class="section-title">INFORMACIÓN DEL PROPIETARIO</div>
        <div class="info-row">
          <span class="label">Nombre:</span> 
          <span class="value">${bicycle.profiles?.full_name || "No disponible"}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span> 
          <span class="value">${bicycle.profiles?.email || "No disponible"}</span>
        </div>
        <div class="info-row">
          <span class="label">Teléfono:</span> 
          <span class="value">${bicycle.profiles?.phone || "No disponible"}</span>
        </div>
        ${
          bicycle.profiles?.curp
            ? `
        <div class="info-row">
          <span class="label">CURP:</span> 
          <span class="value">${bicycle.profiles.curp}</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="verification">
        <div class="section-title">VERIFICACIÓN</div>
        <div class="info-row">
          <span class="label">Para verificar este certificado, visite:</span>
        </div>
        <div class="info-row">
          <span class="value">https://registronacionaldebicis.com/verify/${bicycle.id}</span>
        </div>
        <div class="info-row" style="margin-top: 15px;">
          <span class="label">ID de Registro:</span> 
          <span class="value">${bicycle.id}</span>
        </div>
        <div class="info-row">
          <span class="label">Fecha de Emisión:</span> 
          <span class="value">${new Date().toLocaleDateString("es-MX")}</span>
        </div>
      </div>

      <div class="footer">
        <p>Este certificado confirma que la bicicleta está oficialmente registrada en el Sistema Nacional de Registro de Bicicletas (RNB).</p>
        <p><strong>DOCUMENTO OFICIAL RNB</strong></p>
      </div>
    </body>
    </html>
    `

    // Devolver el HTML como respuesta
    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="certificado-rnb-${bicycle.serial_number}.html"`,
      },
    })
  } catch (error) {
    console.error("Error al generar certificado:", error)
    return NextResponse.json(
      {
        error: "Error al generar certificado",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
