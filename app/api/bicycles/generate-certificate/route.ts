import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import QRCode from "qrcode"
import PDFDocument from "pdfkit"

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
      .eq("payment_status", true) // Solo bicicletas con pago completado
      .single()

    if (bicycleError || !bicycle) {
      return NextResponse.json(
        { error: "Bicicleta no encontrada o pago no completado" },
        { status: bicycleError ? 500 : 404 },
      )
    }

    // Generar URL para el código QR
    const qrData = {
      bicycleId: bicycle.id,
      serialNumber: bicycle.serial_number,
      brand: bicycle.brand,
      model: bicycle.model,
      ownerName: bicycle.profiles.full_name,
      registrationDate: bicycle.registration_date,
    }

    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData))

    // Crear el PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 })
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

    // Añadir contenido al PDF
    doc
      .fontSize(25)
      .text("Registro Nacional de Bicis", { align: "center" })
      .moveDown()
      .fontSize(18)
      .text("Certificado de Registro", { align: "center" })
      .moveDown(2)

    // Información de la bicicleta
    doc
      .fontSize(14)
      .text("Información de la Bicicleta", { underline: true })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Número de Serie: ${bicycle.serial_number}`)
      .text(`Marca: ${bicycle.brand}`)
      .text(`Modelo: ${bicycle.model}`)
      .text(`Color: ${bicycle.color}`)
      .text(`Fecha de Registro: ${new Date(bicycle.registration_date).toLocaleDateString("es-MX")}`)
      .moveDown(1.5)

    // Información del propietario
    doc
      .fontSize(14)
      .text("Información del Propietario", { underline: true })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Nombre: ${bicycle.profiles.full_name}`)
      .text(`CURP: ${bicycle.profiles.curp}`)
      .text(`Correo Electrónico: ${bicycle.profiles.email}`)
      .text(`Teléfono: ${bicycle.profiles.phone}`)
      .moveDown(2)

    // Añadir código QR
    doc.fontSize(14).text("Código QR de Identificación", { align: "center" }).moveDown(0.5)

    doc.image(qrCodeUrl, {
      fit: [200, 200],
      align: "center",
    })

    doc
      .moveDown()
      .fontSize(10)
      .text(
        "Este código QR contiene información básica de la bicicleta y puede ser escaneado para verificar su registro.",
        { align: "center" },
      )
      .moveDown(2)

    // Pie de página
    doc
      .fontSize(10)
      .text(
        `Este certificado confirma que la bicicleta está oficialmente registrada en el Sistema Nacional de Registro de Bicicletas.`,
        { align: "center" },
      )
      .moveDown(0.5)
      .text(`ID de Registro: ${bicycle.id}`, { align: "center" })
      .text(`Fecha de Emisión: ${new Date().toLocaleDateString("es-MX")}`, { align: "center" })

    // Finalizar el PDF
    doc.end()

    // Esperar a que se complete la generación del PDF
    const pdfBuffer = await pdfPromise

    // Devolver el PDF como respuesta
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificado-bicicleta-${bicycle.serial_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error al generar certificado:", error)
    return NextResponse.json({ error: "Error al generar certificado", details: error }, { status: 500 })
  }
}
