import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { code, planId } = await request.json()

    if (!code || !planId) {
      return NextResponse.json({ error: "Código y plan requeridos" }, { status: 400 })
    }

    // Buscar el código promocional
    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single()

    if (error || !promo) {
      return NextResponse.json({ error: "Código promocional no válido" }, { status: 404 })
    }

    // Verificar validez del código
    const now = new Date()
    const validFrom = promo.valid_from ? new Date(promo.valid_from) : null
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null

    // Verificar fechas
    if (validFrom && validFrom > now) {
      return NextResponse.json({ error: "El código aún no es válido" }, { status: 400 })
    }

    if (validUntil && validUntil < now) {
      return NextResponse.json({ error: "El código ha expirado" }, { status: 400 })
    }

    // Verificar usos máximos
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return NextResponse.json({ error: "El código ha alcanzado su límite de usos" }, { status: 400 })
    }

    // Verificar planes aplicables
    if (promo.applicable_plans && !promo.applicable_plans.includes(planId)) {
      return NextResponse.json({ error: "El código no es válido para este plan" }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      code: promo.code,
    })
  } catch (error) {
    console.error("Error validating promo code:", error)
    return NextResponse.json({ error: "Error al validar código" }, { status: 500 })
  }
}
