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

    // Crear contenido HTML del certificado optimizado para PDF y móviles
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
          margin: 15mm;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          background: white;
          color: #333;
          line-height: 1.5;
          font-size: 12px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .certificate {
          max-width: 100%;
          margin: 0 auto;
          border: 3px solid #3B82F6;
          padding: 20px;
          background-color: #fff;
          min-height: 95vh;
          position: relative;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #3B82F6;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .logo {
          color: #3B82F6;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
          letter-spacing: 3px;
        }
        
        .subtitle {
          color: #666;
          font-size: 16px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .certificate-title {
          font-size: 14px;
          color: #333;
          font-weight: bold;
          margin-top: 8px;
          text-transform: uppercase;
        }
        
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .section-title {
          color: #3B82F6;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .info-row {
          margin-bottom: 8px;
          font-size: 11px;
        }
        
        .label {
          font-weight: bold;
          color: #333;
          display: block;
          margin-bottom: 2px;
        }
        
        .value {
          color: #555;
          font-weight: normal;
          word-wrap: break-word;
        }
        
        .verification {
          background: #F8FAFC;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
          border: 1px solid #E2E8F0;
        }
        
        .footer {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          text-align: center;
          padding-top: 15px;
          border-top: 1px solid #E5E7EB;
          font-size: 10px;
          color: #666;
        }
        
        .official-seal {
          background: #3B82F6;
          color: white;
          padding: 10px;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 15px auto;
          font-weight: bold;
          font-size: 9px;
          text-align: center;
          line-height: 1.2;
        }
        
        .qr-placeholder {
          width: 60px;
          height: 60px;
          border: 2px solid #3B82F6;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #3B82F6;
          text-align: center;
        }
        
        .mobile-instructions {
          display: none;
          background: #FEF3C7;
          border: 1px solid #F59E0B;
          padding: 10px;
          border-radius: 6px;
          margin: 10px 0;
          font-size: 11px;
          color: #92400E;
        }
        
        @media screen and (max-width: 768px) {
          .mobile-instructions {
            display: block;
          }
          
          .certificate {
            padding: 15px;
            border-width: 2px;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
            gap: 5px;
          }
          
          .logo {
            font-size: 24px;
          }
          
          .subtitle {
            font-size: 14px;
          }
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .certificate {
            border: 3px solid #3B82F6 !important;
            box-shadow: none;
            min-height: auto;
          }
          
          .no-print, .mobile-instructions {
            display: none !important;
          }
          
          .footer {
            position: relative;
            bottom: auto;
            left: auto;
            right: auto;
          }
        }
      </style>
    </head>
    <body>
      <div class="mobile-instructions no-print">
        📱 <strong>Para guardar como PDF:</strong> Toca el botón "Compartir" de tu navegador y selecciona "Imprimir" o "Guardar como PDF"
      </div>
      
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
              <span class="label">Tipo:</span>
              <span class="value">${bicycle.bike_type || "No especificado"}</span>
            </div>
            <div class="info-row">
              <span class="label">Año:</span>
              <span class="value">${bicycle.year || "No especificado"}</span>
            </div>
            ${
              bicycle.wheel_size
                ? `
            <div class="info-row">
              <span class="label">Rodada:</span>
              <span class="value">${bicycle.wheel_size}</span>
            </div>
            `
                : ""
            }
            ${
              bicycle.groupset
                ? `
            <div class="info-row">
              <span class="label">Grupo:</span>
              <span class="value">${bicycle.groupset}</span>
            </div>
            `
                : ""
            }
          </div>
          <div class="info-row">
            <span class="label">Fecha de Registro:</span>
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
            <span class="label">Características:</span>
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
        </div>

        <div class="verification">
          <div class="section-title">Verificación y Autenticidad</div>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; align-items: center;">
            <div>
              <div class="info-row">
                <span class="label">ID de Registro:</span>
                <span class="value">${bicycle.id}</span>
              </div>
              <div class="info-row">
                <span class="label">Fecha de Emisión:</span>
                <span class="value">${new Date().toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</span>
              </div>
              <div class="info-row">
                <span class="label">Verificar en:</span>
                <span class="value">registronacionaldebicis.com/verify/${bicycle.id}</span>
              </div>
            </div>
            <div class="qr-placeholder">
              QR<br>CODE
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
          <p style="margin-top: 10px; font-size: 9px;">
            Para verificar la autenticidad de este documento, visite nuestro sitio web oficial y utilice el ID de registro proporcionado.
          </p>
        </div>
      </div>
      
      <button class="no-print" onclick="window.print()" style="
        display: block;
        margin: 20px auto;
        padding: 12px 24px;
        background-color: #3B82F6;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        font-weight: 600;
      ">
        📄 Guardar como PDF / Imprimir
      </button>
      
      <script>
        // Mejorar experiencia en móviles
        document.addEventListener('DOMContentLoaded', function() {
          // Detectar si es móvil
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isMobile) {
            // Ajustar el viewport para mejor visualización
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
              viewport.setAttribute('content', 'width=device-width, initial-scale=0.8, user-scalable=yes');
            }
          }
          
          // Función mejorada para imprimir/guardar PDF
          window.print = function() {
            if (isMobile) {
              // En móviles, usar la función nativa del navegador
              if (window.navigator && window.navigator.share) {
                // Si soporta Web Share API
                window.navigator.share({
                  title: 'Certificado RNB - ${bicycle.brand} ${bicycle.model}',
                  text: 'Certificado oficial de registro de bicicleta',
                  url: window.location.href
                }).catch(console.error);
              } else {
                // Fallback para móviles sin Web Share API
                window.print();
              }
            } else {
              // En desktop, usar print normal
              window.print();
            }
          };
        });
      </script>
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
        "X-Frame-Options": "SAMEORIGIN",
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
