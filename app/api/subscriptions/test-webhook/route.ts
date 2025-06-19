import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  try {
    console.log("🧪 Iniciando test de webhook...")

    // Simular datos de webhook
    const testData = {
      sessionId: "cs_test_123456789",
      userId: "test-user-id",
      planType: "básico",
      bicycleLimit: 1,
      amount: 4000,
    }

    console.log("📋 Datos de prueba:", testData)

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-04-30.basil" as any,
    })

    const supabase = createServerClient()

    // Simular creación de suscripción
    const subscriptionData = {
      user_id: testData.userId,
      stripe_subscription_id: `sub_test_${Date.now()}`,
      stripe_customer_id: `cus_test_${Date.now()}`,
      status: "active",
      plan_type: testData.planType,
      bicycle_limit: testData.bicycleLimit,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    console.log("💾 Datos de suscripción de prueba:", subscriptionData)

    return NextResponse.json({
      success: true,
      message: "Test de webhook completado",
      testData,
      subscriptionData,
    })
  } catch (error) {
    console.error("❌ Error en test de webhook:", error)
    return NextResponse.json(
      {
        error: "Error en test de webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
