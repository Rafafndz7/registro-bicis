import { createServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    console.log("🔍 API: Buscando bicicleta con ID:", params.id)

    // Obtener la bicicleta usando service role (sin restricciones RLS)
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("*")
      .eq("id", params.id)
      .eq("payment_status", true)
      .single()

    console.log("🚴 API: Bicycle data:", bicycle)
    console.log("❌ API: Bicycle error:", bicycleError)

    if (bicycleError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    // Obtener el perfil del propietario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", bicycle.user_id)
      .single()

    console.log("👤 API: Profile data:", profile)
    console.log("❌ API: Profile error:", profileError)

    // Obtener imágenes
    const { data: images } = await supabase.from("bicycle_images").select("*").eq("bicycle_id", params.id)

    console.log("🖼️ API: Images:", images)

    // Combinar datos
    const result = {
      bicycle,
      profile,
      images: images || [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ API Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
