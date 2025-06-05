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

    // Crear contenido HTML del certificado optimizado para PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificado RNB - ${bicycle.brand} ${bicycle.model}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          margin: 0;
          padding: 0;
          background: white;
          color: #333;
          line-height: 1.4;
          font-size: 14px;
        }
        
        .certificate {
          max-width: 100%;
          margin: 0 auto;
          border: 2px solid #3B82F6;
          padding: 30px;
          background-color: #fff;
          min-height: 90vh;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #3B82F6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .logo {
          color: #3B82F6;
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }
        
        .subtitle {
          color: #666;
          font-size: 20px;
          margin-bottom: 10px;
          font-weight: 600;
        }
        
        .certificate-title {
          font-size: 18px;
          color: #333;
          font-weight: bold;
          margin-top: 10px;
        }
        
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .section-title {
          color: #3B82F6;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .info-row {
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .label {
          font-weight: bold;
          color: #333;
          display: inline-block;
          min-width: 120px;
        }
        
        .value {
          color: #555;
          font-weight: normal;
        }
        
        .verification {
          background: #F8FAFC;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
          border: 1px solid #E2E8F0;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #E5E7EB;
          font-size: 12px;
          color: #666;
        }
        
        .official-seal {
          background: #3B82F6;
          color: white;
          padding: 15px;
          border-radius: 50%;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px auto;
          font-weight: bold;
          font-size: 12px;
          text-align: center;
        }
        
        .qr-placeholder {
          width: 80px;
          height: 80px;
          border: 2px solid #3B82F6;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #3B82F6;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .certificate {
            border: 2px solid #3B82F6 !important;
            box-shadow: none;
          }
          
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">
          <div class="logo">🚲 RNB</div>
          <div class="subtitle">REGISTRO NACIONAL DE BICIS</div>
          <div class="certificate-title">CERTIFICADO OFICIAL DE REGISTRO</div>
        </div>

        <div class="section">
          <div class="section-title">Información de la Bicicleta</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="label">Número de Serie:</span><br>
              <span class="value">${bicycle.serial_number}</span>
            </div>
            <div class="info-row">
              <span class="label">Marca:</span><br>
              <span class="value">${bicycle.brand}</span>
            </div>
            <div class="info-row">
              <span class="label">Modelo:</span><br>
              <span class="value">${bicycle.model}</span>
            </div>
            <div class="info-row">
              <span class="label">Color:</span><br>
              <span class="value">${bicycle.color}</span>
            </div>
          </div>
          <div class="info-row">
            <span class="label">Fecha de Registro:</span><br>
            <span class="value">${new Date(bicycle.registration_date).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
          ${
            bicycle.characteristics
              ? `
          <div class="info-row">
            <span class="label">Características:</span><br>
            <span class="value">${bicycle.characteristics}</span>
          </div>
          `
              : ""
          }
        </div>

        <div class="section">
          <div class="section-title">Información del Propietario</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="label">Nombre:</span><br>
              <span class="value">${bicycle.profiles?.full_name || "No disponible"}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span><br>
              <span class="value">${bicycle.profiles?.email || "No disponible"}</span>
            </div>
            <div class="info-row">
              <span class="label">Teléfono:</span><br>
              <span class="value">${bicycle.profiles?.phone || "No disponible"}</span>
            </div>
            ${
              bicycle.profiles?.curp
                ? `
            <div class="info-row">
              <span class="label">CURP:</span><br>
              <span class="value">${bicycle.profiles.curp}</span>
            </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="verification">
          <div class="section-title">Verificación y Autenticidad</div>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center;">
            <div>
              <div class="info-row">
                <span class="label">ID de Registro:</span><br>
                <span class="value">${bicycle.id}</span>
              </div>
              <div class="info-row">
                <span class="label">Fecha de Emisión:</span><br>
                <span class="value">${new Date().toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</span>
              </div>
              <div class="info-row">
                <span class="label">Verificar en:</span><br>
                <span class="value">registronacionaldebicis.com/verify/${bicycle.id}</span>
              </div>
            </div>
            <div class="qr-placeholder">
              QR CODE
            </div>
          </div>
        </div>

        <div class="official-seal">
          SELLO<br>OFICIAL<br>RNB
        </div>

        <div class="footer">
          <p><strong>Este certificado confirma que la bicicleta está oficialmente registrada en el Sistema Nacional de Registro de Bicicletas (RNB).</strong></p>
          <p>Documento generado electrónicamente - Válido sin firma autógrafa</p>
          <p><strong>DOCUMENTO OFICIAL RNB - ${new Date().getFullYear()}</strong></p>
        </div>
      </div>
    </body>
    </html>
    `

    // Devolver el HTML como respuesta con headers correctos para PDF
    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="certificado-rnb-${bicycle.serial_number}.html"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
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
