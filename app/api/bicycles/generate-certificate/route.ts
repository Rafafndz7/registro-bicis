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

    // Generar número de folio único
    const folioNumber = `RNB-${new Date().getFullYear()}-${String(bicycle.id).padStart(6, "0")}`
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

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
          margin: 20mm;
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
          line-height: 1.4;
          font-size: 11px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .certificate {
          max-width: 100%;
          margin: 0 auto;
          border: 2px solid #4F46E5;
          background-color: #fff;
          position: relative;
          min-height: 100vh;
        }
        
        .header {
          background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);
          color: white;
          padding: 20px;
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          opacity: 0.3;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
          position: relative;
          z-index: 1;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 50%;
          padding: 10px;
          margin-right: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .header-text {
          position: relative;
          z-index: 1;
        }
        
        .main-title {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 3px;
          margin-bottom: 5px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .subtitle {
          font-size: 14px;
          margin-bottom: 8px;
          opacity: 0.95;
        }
        
        .certificate-title {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
          border: 2px solid white;
          padding: 8px 16px;
          display: inline-block;
          border-radius: 25px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
        }
        
        .document-info {
          background: #F8FAFC;
          padding: 15px 20px;
          border-bottom: 3px solid #4F46E5;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          font-size: 10px;
        }
        
        .doc-item {
          text-align: center;
        }
        
        .doc-label {
          font-weight: bold;
          color: #4F46E5;
          text-transform: uppercase;
          font-size: 9px;
          letter-spacing: 1px;
          margin-bottom: 3px;
        }
        
        .doc-value {
          font-size: 12px;
          font-weight: bold;
          color: #1F2937;
        }
        
        .content {
          padding: 25px;
        }
        
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .section-title {
          background: linear-gradient(90deg, #4F46E5, #3B82F6);
          color: white;
          font-size: 12px;
          font-weight: bold;
          padding: 8px 15px;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .info-item {
          background: #F9FAFB;
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid #4F46E5;
        }
        
        .info-label {
          font-weight: bold;
          color: #374151;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .info-value {
          color: #1F2937;
          font-size: 12px;
          font-weight: 600;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .verification-section {
          background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
          padding: 20px;
          border-radius: 10px;
          border: 2px solid #4F46E5;
          margin: 20px 0;
          position: relative;
        }
        
        .verification-section::before {
          content: '🔒';
          position: absolute;
          top: -15px;
          left: 20px;
          background: #4F46E5;
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 14px;
        }
        
        .invoice-section {
          background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
          padding: 20px;
          border-radius: 10px;
          border: 2px solid #10B981;
          margin: 20px 0;
          position: relative;
        }
        
        .invoice-section.no-invoice {
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-color: #F59E0B;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .status-verified {
          background: #10B981;
          color: white;
        }
        
        .status-pending {
          background: #F59E0B;
          color: white;
        }
        
        .official-seal {
          position: absolute;
          top: 50%;
          right: 30px;
          transform: translateY(-50%);
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, #4F46E5 0%, #3730A3 100%);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
          text-align: center;
          line-height: 1.2;
          border: 6px solid white;
          box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
          z-index: 10;
        }
        
        .seal-logo {
          width: 40px;
          height: 40px;
          margin-bottom: 5px;
          filter: brightness(0) invert(1);
        }
        
        .qr-section {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: center;
          margin-top: 15px;
        }
        
        .qr-placeholder {
          width: 80px;
          height: 80px;
          border: 3px solid #4F46E5;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #4F46E5;
          text-align: center;
          font-weight: bold;
          background: linear-gradient(45deg, #EEF2FF, #E0E7FF);
        }
        
        .footer {
          background: #1F2937;
          color: white;
          padding: 20px;
          text-align: center;
          margin-top: 30px;
        }
        
        .footer-content {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .footer-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #60A5FA;
        }
        
        .footer-text {
          font-size: 10px;
          line-height: 1.5;
          margin-bottom: 8px;
        }
        
        .footer-legal {
          font-size: 9px;
          opacity: 0.8;
          border-top: 1px solid #374151;
          padding-top: 10px;
          margin-top: 15px;
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
        
        @media screen and (max-width: 768px) {
          .certificate {
            border-width: 1px;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .document-info {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .main-title {
            font-size: 20px;
          }
          
          .official-seal {
            position: relative;
            right: auto;
            top: auto;
            transform: none;
            margin: 20px auto;
          }
          
          .download-btn {
            display: block;
            width: 90%;
            margin: 10px auto;
            font-size: 16px;
            padding: 18px;
          }
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .certificate {
            border: 2px solid #4F46E5 !important;
            box-shadow: none;
            min-height: auto;
          }
          
          .no-print, .mobile-instructions, .download-buttons {
            display: none !important;
          }
          
          .official-seal {
            position: absolute !important;
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
            <div class="doc-value">${formattedDate}</div>
          </div>
          <div class="doc-item">
            <div class="doc-label">Validez del Certificado</div>
            <div class="doc-value">Indefinida</div>
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
          
          <div class="section">
            <h2 class="section-title">Información de la Factura</h2>
            ${
              invoice
                ? `
                <div class="invoice-section">
                  La factura ha sido verificada y se encuentra adjunta a este certificado.
                  <br><br>
                  <strong>Nombre del Archivo:</strong> ${invoice.original_filename}
                  <br>
                  <strong>Fecha de Carga:</strong> ${new Date(invoice.upload_date).toLocaleDateString("es-MX")}
                  <span class="status-badge status-verified">Factura Verificada</span>
                </div>
              `
                : `
                <div class="invoice-section no-invoice">
                  No se ha adjuntado una factura a este certificado.
                  <br><br>
                  Para mayor seguridad, le recomendamos adjuntar la factura de compra de su bicicleta.
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
      
      <div class="download-buttons no-print">
        <button onclick="downloadAsPDF()" class="download-btn">
          📄 Descargar como PDF
        </button>
        <button onclick="printCertificate()" class="download-btn">
          🖨️ Imprimir Certificado
        </button>
        <button onclick="downloadAsHTML()" class="download-btn" style="background: linear-gradient(135deg, #059669 0%, #10B981 100%);">
          💾 Descargar HTML
        </button>
      </div>
    </body>
    <script>
      function downloadAsPDF() {
        // Usar la función de impresión del navegador que permite guardar como PDF
        window.print();
      }
      
      function printCertificate() {
        // Función de impresión directa
        window.print();
      }
      
      function downloadAsHTML() {
        // Crear un blob con el contenido HTML completo
        const htmlContent = document.documentElement.outerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
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
          
          // Actualizar instrucciones para móvil
          const instructions = document.querySelector('.mobile-instructions');
          if (instructions) {
            instructions.style.display = 'block';
            instructions.innerHTML = \`
              📱 <strong>¡Perfecto! Ya tienes tu certificado</strong><br><br>
              <strong>Para guardarlo como PDF:</strong><br>
              • <strong>Android:</strong> Menú ⋮ → "Imprimir" → "Guardar como PDF"<br>
              • <strong>iPhone:</strong> Botón "Compartir" 📤 → "Imprimir" → pellizcar para ampliar → "Compartir" → "Guardar en Archivos"<br><br>
              <strong>💡 Tip:</strong> También puedes tomar capturas de pantalla del documento completo
            \`;
          }
        }
        
        // Agregar eventos a los botones
        const downloadBtn = document.querySelector('.download-btn:first-child');
        const printBtn = document.querySelector('.download-btn:last-child');
        
        if (downloadBtn) {
          downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            downloadAsPDF();
          });
        }
        
        if (printBtn) {
          printBtn.addEventListener('click', function(e) {
            e.preventDefault();
            printCertificate();
          });
        }
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
