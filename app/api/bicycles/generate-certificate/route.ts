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

    // Verificar suscripción activa del usuario
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (subscriptionError || !subscription) {
      console.error("Error al verificar suscripción:", subscriptionError)
      return NextResponse.json({ error: "No tienes una suscripción activa para generar certificados" }, { status: 403 })
    }

    // Verificar si la suscripción está próxima a vencer (menos de 7 días)
    const currentDate = new Date()
    const expirationDate = new Date(subscription.current_period_end)
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

    // Si la suscripción ya expiró
    if (expirationDate < currentDate) {
      return NextResponse.json(
        { error: "Tu suscripción ha expirado. Renueva tu suscripción para generar certificados." },
        { status: 403 },
      )
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

    // Generar número de folio único
    const folioNumber = `RNB-${new Date().getFullYear()}-${String(bicycle.id).padStart(6, "0")}`
    const currentDateFormatted = currentDate.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Formatear fecha de vencimiento de la suscripción
    const expirationDateFormatted = expirationDate.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Determinar el estado de validez
    let validityStatus = "Válido"
    let validityClass = "status-verified"

    if (daysUntilExpiration <= 7) {
      validityStatus = `Expira en ${daysUntilExpiration} día${daysUntilExpiration !== 1 ? "s" : ""}`
      validityClass = "status-pending"
    }

    // Crear contenido HTML del certificado como factura oficial
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificado Oficial RNB - ${bicycle.brand} ${bicycle.model}</title>
      <style>
        @page {
  size: A4;
  margin: 10mm;
}

body {
  font-family: 'Arial', 'Helvetica', sans-serif;
  background: white;
  color: #333;
  line-height: 1.2;
  font-size: 10px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.certificate {
  max-width: 100%;
  margin: 0 auto;
  border: 2px solid #6B7280;
  background-color: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #374151 0%, #4B5563 100%);
  color: white;
  padding: 16px;
  text-align: center;
  position: relative;
  flex-shrink: 0;
}

.logo {
  width: 50px;
  height: 50px;
  background: white;
  border-radius: 50%;
  padding: 6px;
  margin-right: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.main-title {
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 1px;
  margin-bottom: 2px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: 10px;
  margin-bottom: 4px;
  opacity: 0.95;
}

.certificate-title {
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 2px solid white;
  padding: 4px 10px;
  display: inline-block;
  border-radius: 15px;
  background: rgba(255,255,255,0.1);
}

.document-info {
  background: #F8FAFC;
  padding: 8px 12px;
  border-bottom: 3px solid #6B7280;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  font-size: 8px;
  flex-shrink: 0;
}

.content {
  padding: 8px !important;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px !important;
}

.section-title {
  background: linear-gradient(90deg, #6B7280, #9CA3AF);
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 4px 10px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 3px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px !important;
  margin-bottom: 3px !important;
}

.info-item {
  background: #F9FAFB;
  padding: 3px !important;
  border-radius: 3px;
  border-left: 3px solid #6B7280;
}

.info-label {
  font-weight: bold;
  color: #374151;
  font-size: 7px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.info-value {
  color: #1F2937;
  font-size: 11px;
  font-weight: 600;
}

.verification-section {
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
  padding: 8px;
  border-radius: 6px;
  border: 2px solid #6B7280;
  position: relative;
  font-size: 8px;
}

.invoice-section {
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
  padding: 8px;
  border-radius: 6px;
  border: 2px solid #6B7280;
  position: relative;
  font-size: 8px;
}

.validity-section {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  padding: 8px;
  border-radius: 6px;
  border: 2px solid #F59E0B;
  position: relative;
  font-size: 8px;
  margin-top: 8px;
}

.validity-section.valid {
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
  border-color: #6B7280;
}

.official-seal {
  background: radial-gradient(circle, #6B7280 0%, #374151 100%);
  box-shadow: 0 4px 15px rgba(107, 114, 128, 0.4);
  position: absolute;
  top: 35%;
  right: 15px;
  transform: translateY(-50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 7px;
  text-align: center;
  line-height: 1.1;
  border: 3px solid white;
  z-index: 10;
}

.seal-logo {
  width: 25px;
  height: 25px;
  margin-bottom: 2px;
  filter: brightness(0) invert(1);
}

.footer {
  background: #1F2937;
  color: white;
  padding: 8px;
  text-align: center;
  flex-shrink: 0;
}

.footer-title {
  font-size: 9px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #60A5FA;
}

.footer-text {
  font-size: 7px;
  line-height: 1.3;
  margin-bottom: 3px;
}

.footer-legal {
  font-size: 6px;
  opacity: 0.8;
  border-top: 1px solid #374151;
  padding-top: 4px;
  margin-top: 6px;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.header-text {
  position: relative;
  z-index: 1;
}

.doc-item {
  text-align: center;
}

.doc-label {
  font-weight: bold;
  color: #6B7280;
  text-transform: uppercase;
  font-size: 8px;
  letter-spacing: 1px;
  margin-bottom: 2px;
}

.doc-value {
  font-size: 12px;
  font-weight: bold;
  color: #1F2937;
}

.section {
  page-break-inside: avoid;
  margin-bottom: 3px !important;
}

.footer-content {
  max-width: 600px;
  margin: 0 auto;
}

.mobile-instructions {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border: 2px solid #F59E0B;
  padding: 20px;
  border-radius: 10px;
  margin: 20px 0;
  font-size: 14px;
  color: #92400E;
  text-align: center;
}

.download-buttons {
  text-align: center;
  margin: 30px 0;
  padding: 25px;
  background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
  border-radius: 15px;
  border: 2px solid #CBD5E1;
}

.download-btn {
  display: inline-block;
  margin: 10px;
  padding: 15px 30px;
  background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.qr-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 15px;
  align-items: center;
  margin-top: 8px;
}

.qr-placeholder {
  width: 60px;
  height: 60px;
  border: 2px solid #6B7280;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  color: #6B7280;
  text-align: center;
  font-weight: bold;
  background: linear-gradient(45deg, #F3F4F6, #E5E7EB);
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 8px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 5px;
}

.status-verified {
  background: #10B981;
  color: white;
}

.status-pending {
  background: #F59E0B;
  color: white;
}

.status-expired {
  background: #EF4444;
  color: white;
}

.invoice-section.no-invoice {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-color: #F59E0B;
}

.full-width {
  grid-column: 1 / -1;
}

/* Eliminar completamente las instrucciones y botones */
.mobile-instructions, 
.download-buttons,
.no-print,
.download-btn {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  height: 0 !important;
  width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
}

@media screen and (max-width: 768px) {
  body {
    font-size: 8px !important;
  }
  
  .certificate {
    border-width: 1px;
    height: auto;
    max-height: 100vh;
    overflow: hidden;
  }
  
  .content {
    padding: 6px !important;
    gap: 3px !important;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 3px !important;
  }
  
  .document-info {
    grid-template-columns: 1fr;
    gap: 3px !important;
    padding: 4px 6px !important;
  }
  
  .main-title {
    font-size: 16px !important;
  }
  
  .section {
    margin-bottom: 2px !important;
  }
  
  .section-title {
    font-size: 9px !important;
    padding: 2px 6px !important;
    margin-bottom: 3px !important;
  }
  
  .info-item {
    padding: 2px !important;
  }
  
  .info-label {
    font-size: 6px !important;
  }
  
  .info-value {
    font-size: 9px !important;
  }
  
  .verification-section,
  .invoice-section,
  .validity-section {
    padding: 4px !important;
    font-size: 6px !important;
    margin-top: 2px !important;
  }
  
  .official-seal {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    margin: 8px auto;
    width: 60px !important;
    height: 60px !important;
    font-size: 5px !important;
  }
  
  .footer {
    padding: 4px !important;
    font-size: 5px !important;
  }
  
  .footer-title {
    font-size: 6px !important;
  }
  
  .qr-placeholder {
    width: 40px !important;
    height: 40px !important;
    font-size: 5px !important;
  }
  
  .status-badge {
    font-size: 6px !important;
    padding: 2px 4px !important;
  }
  
  /* Ocultar botones en móvil también */
  .download-btn {
    display: none !important;
  }
}

/* Media query específica para móviles en modo impresión */
@media print and (max-width: 768px) {
  body {
    font-size: 7px !important;
    height: 100vh !important;
    overflow: hidden !important;
  }
  
  .certificate {
    height: 100vh !important;
    max-height: 100vh !important;
  }
  
  .content {
    padding: 4px !important;
    gap: 2px !important;
  }
  
  .section {
    margin-bottom: 1px !important;
  }
  
  .info-grid {
    gap: 2px !important;
  }
  
  .info-item {
    padding: 1px !important;
  }
  
  .official-seal {
    width: 35px !important;
    height: 35px !important;
    font-size: 4px !important;
  }
}
      </style>
    </head>
    <body>
      <div class="mobile-instructions no-print">
        📱 <strong>Instrucciones para móvil:</strong><br><br>
        • <strong>Android:</strong> Menú ⋮ → "Imprimir" → "Guardar como PDF"<br>
        • <strong>iPhone:</strong> Botón "Compartir" 📤 → "Imprimir" → pellizcar para ampliar → "Compartir" → "Guardar en Archivos"<br><br>
        <strong>💡 Tip:</strong> También puedes tomar capturas de pantalla del documento completo
      </div>
      
      <div class="certificate">
        <div class="header">
          <div class="logo-container">
            <div class="logo">
              <img src="/logo-rnb.png" alt="RNB Logo" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
            <div class="header-text">
              <h1 class="main-title">Registro Nacional de Bicicletas</h1>
              <p class="subtitle">Certificado Oficial de Registro</p>
              <span class="certificate-title">Bicicleta Verificada</span>
            </div>
          </div>
        </div>
        
        <div class="document-info">
          <div class="doc-item">
            <div class="doc-label">Número de Folio</div>
            <div class="doc-value">${folioNumber}</div>
          </div>
          <div class="doc-item">
            <div class="doc-label">Fecha de Emisión</div>
            <div class="doc-value">${currentDateFormatted}</div>
          </div>
        </div>
        
        <div class="content">
          <div class="section">
            <h2 class="section-title">Información del Propietario</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nombre Completo</div>
                <div class="info-value">${bicycle.profiles?.full_name || "No Disponible"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Correo Electrónico</div>
                <div class="info-value">${bicycle.profiles?.email || "No Disponible"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">CURP</div>
                <div class="info-value">${bicycle.profiles?.curp || "No Disponible"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Dirección</div>
                <div class="info-value">${bicycle.profiles?.address || "No Disponible"}</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">Teléfono</div>
                <div class="info-value">${bicycle.profiles?.phone || "No Disponible"}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Detalles de la Bicicleta</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Marca</div>
                <div class="info-value">${bicycle.brand || "No Disponible"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Modelo</div>
                <div class="info-value">${bicycle.model || "No Disponible"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Año</div>
                <div class="info-value">${bicycle.year || "No Disponible"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Color</div>
                <div class="info-value">${bicycle.color || "No Disponible"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Número de Serie</div>
                <div class="info-value">${bicycle.serial_number || "No Disponible"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tipo de Bicicleta</div>
                <div class="info-value">${bicycle.bicycle_type || "No Disponible"}</div>
              </div>
            </div>
          </div>
          
          <div class="verification-section">
            Este certificado valida que la bicicleta ha sido registrada en la base de datos del Registro Nacional de Bicicletas (RNB) y está asociada al propietario actual.
            <div class="qr-section">
              <div>
                Para verificar la autenticidad de este certificado, escanee el código QR con su dispositivo móvil.
              </div>
              <div class="qr-placeholder">
                Código QR aquí
              </div>
            </div>
          </div>

          <div class="validity-section ${daysUntilExpiration > 7 ? "valid" : ""}">
            <strong>TÉRMINOS DE VALIDEZ Y CONDICIONES</strong>
            <br><br>
            <strong>Validez del Certificado:</strong> Este documento es válido únicamente mientras la suscripción del propietario permanezca activa. La expiración o cancelación de la suscripción invalida automáticamente este certificado.
            <br><br>
            <strong>Plan Actual:</strong> ${subscription.plan_type} (${subscription.bicycle_limit} bicicleta${subscription.bicycle_limit !== 1 ? "s" : ""} registradas)
            <br>
            <strong>Vencimiento de Suscripción:</strong> ${expirationDateFormatted}
            <br><br>
            <strong>Naturaleza del Documento:</strong> Este certificado constituye un registro en la base de datos del RNB y no representa un título de propiedad legal.
            <br><br>
            <strong>Renovación:</strong> Para mantener la validez de este certificado, la suscripción debe renovarse antes de su vencimiento.
            <span class="status-badge ${validityClass}">${validityStatus}</span>
          </div>
          
          <div class="section">
            <h2 class="section-title">Información de la Factura</h2>
            ${
              invoice
                ? `
    <div class="invoice-section">
      <strong>FACTURA OFICIAL ADJUNTA</strong>
      <br><br>
      Este certificado cuenta con factura de compra verificada, lo que proporciona respaldo documental completo para el registro de la bicicleta.
      <br><br>
      <strong>Archivo:</strong> ${invoice.original_filename}
      <br>
      <strong>Fecha de Verificación:</strong> ${new Date(invoice.upload_date).toLocaleDateString("es-MX")}
      <br><br>
      <strong>Recomendación:</strong> Mantenga siempre su factura original disponible junto con este certificado para cualquier trámite o verificación.
      <span class="status-badge status-verified">Factura Verificada</span>
    </div>
  `
                : `
    <div class="invoice-section no-invoice">
      <strong>RECOMENDACIÓN IMPORTANTE</strong>
      <br><br>
      Para mayor respaldo documental de su registro, se recomienda adjuntar la factura original de compra de la bicicleta.
      <br><br>
      <strong>Beneficios de adjuntar factura:</strong>
      <br>• Respaldo documental completo
      <br>• Mayor credibilidad del registro
      <br>• Facilita procesos de verificación
      <br>• Documentación integral del bien
      <br><br>
      <strong>Importante:</strong> Mantenga siempre su factura original disponible junto con este certificado.
      <span class="status-badge status-pending">Factura Pendiente</span>
    </div>
  `
            }
          </div>
        </div>
        
        <div class="official-seal">
          <img src="/logo-rnb.png" alt="RNB" class="seal-logo" />
          <div>SELLO</div>
          <div>OFICIAL</div>
          <div>RNB</div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <h3 class="footer-title">Registro Nacional de Bicicletas (RNB)</h3>
            <p class="footer-text">
              Este certificado es un documento oficial que acredita el registro de la bicicleta en la base de datos del RNB.
            </p>
            <p class="footer-text">
              Para más información, visite nuestro sitio web o contáctenos a través de nuestros canales de atención al cliente.
            </p>
            <div class="footer-legal">
              © 2024 Registro Nacional de Bicicletas. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
      
      <div class="download-buttons no-print" style="display: block !important;">
        <button onclick="downloadAsPDF()" class="download-btn" style="display: inline-block !important;">
          📄 Descargar como PDF
        </button>
        <button onclick="printCertificate()" class="download-btn" style="display: inline-block !important;">
          🖨️ Imprimir Certificado
        </button>
        <button onclick="downloadAsHTML()" class="download-btn" style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); display: inline-block !important;">
          💾 Descargar HTML
        </button>
      </div>
    </body>
    <script>
function downloadAsPDF() {
  window.print();
}

function printCertificate() {
  window.print();
}

function downloadAsHTML() {
  const htmlContent = document.documentElement.outerHTML;
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'certificado-rnb-${bicycle.serial_number}.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Asegurar que los botones funcionen
document.addEventListener('DOMContentLoaded', function() {
  console.log('Certificado cargado - botones disponibles');
});
</script>
    </html>
    `

    // Configurar encabezados para la respuesta
    const headers = new Headers()
    headers.append("Content-Type", "text/html")

    // Retornar la respuesta con el contenido HTML y los encabezados
    return new NextResponse(htmlContent, {
      status: 200,
      headers: headers,
    })
  } catch (error: any) {
    console.error("Error al generar el certificado:", error)
    return NextResponse.json({ error: "Error al generar el certificado" }, { status: 500 })
  }
}
