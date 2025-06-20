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

    // Obtener información de la factura si existe
    const { data: invoice } = await supabase
      .from("bicycle_invoices")
      .select("original_filename, upload_date")
      .eq("bicycle_id", bicycleId)
      .eq("user_id", session.user.id)
      .single()

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
        
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .logo-svg {
          width: 60px;
          height: 60px;
          margin-right: 15px;
        }
        
        .logo-text {
          color: #3B82F6;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 2px;
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
        
        .invoice-section {
          background: #F0F9FF;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
          border: 1px solid #0EA5E9;
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
          background: #FEF3C7;
          border: 1px solid #F59E0B;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          font-size: 14px;
          color: #92400E;
          text-align: center;
        }
        
        .download-buttons {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: #F8FAFC;
          border-radius: 8px;
        }
        
        .download-btn {
          display: inline-block;
          margin: 10px;
          padding: 15px 25px;
          background-color: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.3s;
        }
        
        .download-btn:hover {
          background-color: #2563EB;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-verified {
          background-color: #10B981;
          color: white;
        }
        
        .status-pending {
          background-color: #F59E0B;
          color: white;
        }
        
        @media screen and (max-width: 768px) {
          .certificate {
            padding: 15px;
            border-width: 2px;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
            gap: 5px;
          }
          
          .logo-text {
            font-size: 24px;
          }
          
          .subtitle {
            font-size: 14px;
          }
          
          .download-btn {
            display: block;
            width: 90%;
            margin: 10px auto;
            font-size: 18px;
            padding: 18px;
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
          
          .no-print, .mobile-instructions, .download-buttons {
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
        📱 <strong>Instrucciones para móvil:</strong><br>
        • <strong>Android:</strong> Usa el menú ⋮ → "Imprimir" → "Guardar como PDF"<br>
        • <strong>iPhone:</strong> Toca el botón "Compartir" 📤 → "Imprimir" → pellizca para ampliar → "Compartir" → "Guardar en Archivos"<br>
        • <strong>Alternativa:</strong> Toma captura de pantalla de todo el documento
      </div>
      
      <div class="certificate">
        <div class="header">
          <div class="logo-container">
            <svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18.5" cy="17.5" r="3.5"/>
              <circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="15" cy="5" r="1"/>
              <path d="m14 17 6-6-3-3-4 4"/>
              <path d="M9 17h6"/>
              <path d="m8 17-2-5 1.5-1.5L14 5"/>
              <path d="M5.5 21V9"/>
              <path d="M18.5 21v-2"/>
            </svg>
            <div class="logo-text">RNB</div>
          </div>
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

        ${
          invoice
            ? `
        <div class="invoice-section">
          <div class="section-title">📄 Documentación de Compra</div>
          <div class="info-row">
            <span class="label">Estado de Factura:</span>
            <span class="value">
              <span class="status-badge status-verified">✓ FACTURA REGISTRADA</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Archivo:</span>
            <span class="value">${invoice.original_filename}</span>
          </div>
          <div class="info-row">
            <span class="label">Fecha de Registro:</span>
            <span class="value">${new Date(invoice.upload_date).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
        </div>
        `
            : `
        <div class="invoice-section">
          <div class="section-title">📄 Documentación de Compra</div>
          <div class="info-row">
            <span class="label">Estado de Factura:</span>
            <span class="value">
              <span class="status-badge status-pending">⚠ SIN FACTURA REGISTRADA</span>
            </span>
          </div>
          <div class="info-row">
            <span class="value" style="font-style: italic; color: #666;">
              No se ha registrado factura de compra para esta bicicleta
            </span>
          </div>
        </div>
        `
        }

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
      
      <div class="download-buttons no-print">
        <button onclick="window.print()" class="download-btn">
          📄 Imprimir / Guardar como PDF
        </button>
        <button onclick="downloadAsFile()" class="download-btn">
          💾 Descargar Archivo
        </button>
      </div>
      
      <script>
        function downloadAsFile() {
          // Crear un blob con el contenido HTML
          const htmlContent = document.documentElement.outerHTML;
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          
          // Crear enlace de descarga
          const a = document.createElement('a');
          a.href = url;
          a.download = 'certificado-rnb-${bicycle.serial_number}.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        
        // Mejorar experiencia en móviles
        document.addEventListener('DOMContentLoaded', function() {
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isMobile) {
            // Ajustar el viewport para mejor visualización
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
              viewport.setAttribute('content', 'width=device-width, initial-scale=0.8, user-scalable=yes');
            }
            
            // Agregar instrucciones específicas para móvil
            const instructions = document.querySelector('.mobile-instructions');
            if (instructions) {
              instructions.style.display = 'block';
              instructions.innerHTML = \`
          📱 <strong>¡Perfecto! Ya tienes tu certificado</strong><br><br>
          <strong>Para guardarlo:</strong><br>
          • <strong>Android:</strong> Menú ⋮ → "Imprimir" → "Guardar como PDF"<br>
          • <strong>iPhone:</strong> Botón "Compartir" 📤 → "Imprimir" → pellizcar para ampliar → "Compartir" → "Guardar en Archivos"<br><br>
          <strong>💡 Tip:</strong> También puedes tomar capturas de pantalla del documento completo
        \`;
            }
          }
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
