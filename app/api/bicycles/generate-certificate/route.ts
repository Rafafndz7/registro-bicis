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
      return NextResponse.json(
        { error: "Bicicleta no encontrada o pago no completado" },
        { status: bicycleError ? 500 : 404 },
      )
    }

    // Importar dinámicamente PDFKit
    const PDFDocument = (await import("pdfkit")).default

    // Crear el PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Certificado RNB - ${bicycle.brand} ${bicycle.model}`,
        Author: "Registro Nacional de Bicis",
        Subject: "Certificado de Registro de Bicicleta",
      },
    })

    const chunks: Buffer[] = []

    doc.on("data", (chunk) => {
      chunks.push(chunk)
    })

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        const result = Buffer.concat(chunks)
        resolve(result)
      })
    })

    // Header
    doc
      .fontSize(28)
      .fillColor("#1e88e5")
      .text("RNB", 50, 50)
      .fontSize(20)
      .text("REGISTRO NACIONAL DE BICIS", 120, 55)
      .fontSize(16)
      .fillColor("#666")
      .text("Certificado Oficial de Registro", 120, 80)

    // Línea separadora
    doc.strokeColor("#1e88e5").lineWidth(3).moveTo(50, 120).lineTo(545, 120).stroke()

    // Información de la bicicleta
    doc.fontSize(18).fillColor("#1e88e5").text("INFORMACIÓN DE LA BICICLETA", 50, 150)

    doc
      .fontSize(12)
      .fillColor("#000")
      .text(`Número de Serie: ${bicycle.serial_number}`, 50, 180)
      .text(`Marca: ${bicycle.brand}`, 50, 200)
      .text(`Modelo: ${bicycle.model}`, 50, 220)
      .text(`Color: ${bicycle.color}`, 50, 240)
      .text(`Fecha de Registro: ${new Date(bicycle.registration_date).toLocaleDateString("es-MX")}`, 50, 260)

    if (bicycle.characteristics) {
      doc.text(`Características: ${bicycle.characteristics}`, 50, 280)
    }

    // Información del propietario
    doc.fontSize(18).fillColor("#1e88e5").text("INFORMACIÓN DEL PROPIETARIO", 50, 320)

    doc
      .fontSize(12)
      .fillColor("#000")
      .text(`Nombre: ${bicycle.profiles.full_name}`, 50, 350)
      .text(`Email: ${bicycle.profiles.email}`, 50, 370)
      .text(`Teléfono: ${bicycle.profiles.phone}`, 50, 390)

    if (bicycle.profiles.curp) {
      doc.text(`CURP: ${bicycle.profiles.curp}`, 50, 410)
    }

    // Código QR (texto simple por ahora)
    doc.fontSize(18).fillColor("#1e88e5").text("VERIFICACIÓN", 50, 450)

    doc
      .fontSize(12)
      .fillColor("#000")
      .text("Para verificar este certificado, visite:", 50, 480)
      .text(`https://registronacionaldebicis.com/verify/${bicycle.id}`, 50, 500)

    // ID de registro
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`ID de Registro: ${bicycle.id}`, 50, 540)
      .text(`Fecha de Emisión: ${new Date().toLocaleDateString("es-MX")}`, 50, 555)

    // Footer
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(
        "Este certificado confirma que la bicicleta está oficialmente registrada en el Sistema Nacional de Registro de Bicicletas (RNB).",
        50,
        600,
        { width: 495, align: "center" },
      )

    // Sello
    doc.fontSize(14).fillColor("#1e88e5").text("DOCUMENTO OFICIAL RNB", 350, 700)

    // Finalizar el PDF
    doc.end()

    // Esperar a que se complete la generación del PDF
    const pdfBuffer = await pdfPromise

    // Devolver el PDF como respuesta
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificado-rnb-${bicycle.serial_number}.pdf"`,
        "Cache-Control": "no-cache",
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
