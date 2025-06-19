import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - Obtener detalles de una bicicleta
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("bicycles")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener bicicleta:", error)
    return NextResponse.json({ error: "Error al obtener bicicleta" }, { status: 500 })
  }
}

// PUT - Actualizar una bicicleta
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { brand, model, color, characteristics } = await request.json()

    // Validar datos
    if (!brand || !model || !color) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    // Verificar que la bicicleta pertenezca al usuario
    const { data: existingBicycle, error: checkError } = await supabase
      .from("bicycles")
      .select("id, payment_status")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (checkError || !existingBicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    // Verificar si es admin
    const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()
    const isAdmin = userProfile?.role === "admin"

    // Permitir edición siempre (usuarios normales y admin)
    // Solo mostrar advertencia si está pagada pero permitir la edición

    // Solo permitir edición si no está pagada O si es admin
    // if (existingBicycle.payment_status && !isAdmin) {
    //   return NextResponse.json(
    //     { error: "No se puede editar una bicicleta que ya está registrada y pagada" },
    //     { status: 400 },
    //   )
    // }

    // Actualizar la bicicleta
    const { data, error } = await supabase
      .from("bicycles")
      .update({
        brand,
        model,
        color,
        characteristics,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Bicicleta actualizada correctamente",
      bicycle: data,
    })
  } catch (error) {
    console.error("Error al actualizar bicicleta:", error)
    return NextResponse.json({ error: "Error al actualizar bicicleta" }, { status: 500 })
  }
}

// DELETE - Eliminar una bicicleta
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que la bicicleta pertenezca al usuario
    const { data: bicycle, error: checkError } = await supabase
      .from("bicycles")
      .select("id, payment_status")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (checkError || !bicycle) {
      return NextResponse.json({ error: "Bicicleta no encontrada" }, { status: 404 })
    }

    // Verificar si es admin
    const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()
    const isAdmin = userProfile?.role === "admin"

    // Permitir eliminación siempre (usuarios normales y admin)
    // Solo reducir contador si es admin eliminando bici pagada
    if (isAdmin && bicycle.payment_status) {
      // Buscar la suscripción activa del usuario
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .single()

      if (subscription && subscription.bicycles_used > 0) {
        // Reducir el contador
        await supabase
          .from("subscriptions")
          .update({
            bicycles_used: subscription.bicycles_used - 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)
      }
    }

    // Solo permitir eliminación si no está pagada O si es admin
    // if (bicycle.payment_status && !isAdmin) {
    //   return NextResponse.json(
    //     { error: "No se puede eliminar una bicicleta que ya está registrada y pagada" },
    //     { status: 400 },
    //   )
    // }

    // Si es admin y la bici está pagada, reducir el contador de la suscripción
    // if (isAdmin && bicycle.payment_status) {
    //   // Buscar la suscripción activa del usuario
    //   const { data: subscription } = await supabase
    //     .from("subscriptions")
    //     .select("*")
    //     .eq("user_id", session.user.id)
    //     .eq("status", "active")
    //     .single()

    //   if (subscription && subscription.bicycles_used > 0) {
    //     // Reducir el contador
    //     await supabase
    //       .from("subscriptions")
    //       .update({
    //         bicycles_used: subscription.bicycles_used - 1,
    //         updated_at: new Date().toISOString(),
    //       })
    //       .eq("id", subscription.id)
    //   }
    // }

    // Eliminar imágenes asociadas
    const { error: imagesError } = await supabase.from("bicycle_images").delete().eq("bicycle_id", params.id)

    if (imagesError) {
      console.error("Error al eliminar imágenes:", imagesError)
    }

    // Eliminar pagos asociados
    const { error: paymentsError } = await supabase
      .from("payments")
      .delete()
      .eq("bicycle_id", params.id)
      .eq("user_id", session.user.id)

    if (paymentsError) {
      console.error("Error al eliminar pagos:", paymentsError)
    }

    // Eliminar la bicicleta
    const { error: deleteError } = await supabase
      .from("bicycles")
      .delete()
      .eq("id", params.id)
      .eq("user_id", session.user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: "Bicicleta eliminada correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar bicicleta:", error)
    return NextResponse.json({ error: "Error al eliminar bicicleta" }, { status: 500 })
  }
}
