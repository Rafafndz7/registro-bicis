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
    const folioNumber = `RNB-${new Date().getFullYear()}-${String(bicycle.id).padStart(6, '0')}`
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
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDYwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy AyNDUgMjEzIDI0NSAyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMyAyNDUgMjEzIDI0NSAyMTMgMjQ1QzIxMy
