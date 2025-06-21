import { supabase } from "../lib/supabase.js"

console.log("🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA DE IMÁGENES")
console.log("=".repeat(50))

async function debugComplete() {
  try {
    // 1. Verificar buckets de storage
    console.log("\n1️⃣ VERIFICANDO BUCKETS DE STORAGE:")
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.log("❌ Error obteniendo buckets:", bucketsError)
    } else {
      console.log("✅ Buckets encontrados:", buckets?.length || 0)
      buckets?.forEach((bucket) => {
        console.log(`  📁 ${bucket.name} - ${bucket.public ? "Público" : "Privado"}`)
      })
    }

    // 2. Verificar archivos en bucket bicycle-images
    console.log("\n2️⃣ VERIFICANDO ARCHIVOS EN BUCKET:")
    const { data: files, error: filesError } = await supabase.storage.from("bicycle-images").list("", { limit: 10 })

    if (filesError) {
      console.log("❌ Error listando archivos:", filesError)
    } else {
      console.log("✅ Archivos en bucket:", files?.length || 0)
      files?.forEach((file) => {
        console.log(`  🖼️ ${file.name} - ${file.metadata?.size || "N/A"} bytes`)
      })
    }

    // 3. Verificar bicicletas en la base de datos
    console.log("\n3️⃣ VERIFICANDO BICICLETAS:")
    const { data: bicycles, error: bicyclesError } = await supabase
      .from("bicycles")
      .select("id, brand, model, created_at, payment_status")
      .order("created_at", { ascending: false })
      .limit(5)

    if (bicyclesError) {
      console.log("❌ Error obteniendo bicicletas:", bicyclesError)
    } else {
      console.log("✅ Bicicletas encontradas:", bicycles?.length || 0)
      bicycles?.forEach((bike) => {
        console.log(`  🚲 ${bike.brand} ${bike.model} - ${bike.created_at} - Pagado: ${bike.payment_status}`)
      })
    }

    // 4. Verificar imágenes en bicycle_images
    console.log("\n4️⃣ VERIFICANDO TABLA BICYCLE_IMAGES:")
    const { data: images, error: imagesError } = await supabase
      .from("bicycle_images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (imagesError) {
      console.log("❌ Error obteniendo imágenes:", imagesError)
    } else {
      console.log("✅ Registros de imágenes:", images?.length || 0)
      images?.forEach((img) => {
        console.log(`  🖼️ Bicicleta: ${img.bicycle_id}`)
        console.log(`     URL: ${img.image_url}`)
        console.log(`     Creado: ${img.created_at}`)
        console.log("")
      })
    }

    // 5. Verificar relación entre bicicletas e imágenes
    console.log("\n5️⃣ VERIFICANDO RELACIÓN BICICLETAS-IMÁGENES:")
    if (bicycles && bicycles.length > 0) {
      const bicycleIds = bicycles.map((b) => b.id)
      const { data: relatedImages, error: relError } = await supabase
        .from("bicycle_images")
        .select("bicycle_id, image_url")
        .in("bicycle_id", bicycleIds)

      if (relError) {
        console.log("❌ Error verificando relación:", relError)
      } else {
        console.log("✅ Imágenes relacionadas:", relatedImages?.length || 0)
        bicycles.forEach((bike) => {
          const hasImage = relatedImages?.some((img) => img.bicycle_id === bike.id)
          console.log(`  🚲 ${bike.brand} ${bike.model}: ${hasImage ? "✅ Con imagen" : "❌ Sin imagen"}`)
        })
      }
    }

    // 6. Probar URL de imagen (si existe)
    console.log("\n6️⃣ PROBANDO URLS DE IMÁGENES:")
    if (images && images.length > 0) {
      const testImage = images[0]
      console.log(`🔗 Probando URL: ${testImage.image_url}`)

      try {
        const response = await fetch(testImage.image_url)
        console.log(`📡 Status: ${response.status} ${response.statusText}`)
        console.log(`📏 Content-Length: ${response.headers.get("content-length") || "N/A"}`)
        console.log(`🎭 Content-Type: ${response.headers.get("content-type") || "N/A"}`)
      } catch (fetchError) {
        console.log("❌ Error probando URL:", fetchError.message)
      }
    }
  } catch (error) {
    console.error("💥 Error general:", error)
  }
}

debugComplete()
