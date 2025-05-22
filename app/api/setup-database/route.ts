import { createClient } from "@supabase/supabase-js"

// Esta ruta se usará solo una vez para configurar la base de datos
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Faltan credenciales de Supabase" }), { status: 500 })
    }

    // Usar la clave de servicio para tener permisos completos
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Crear tabla de usuarios (profiles)
    const { error: profilesError } = await supabase.rpc("create_table_if_not_exists", {
      table_name: "profiles",
      definition: `
        id UUID PRIMARY KEY REFERENCES auth.users(id),
        full_name TEXT NOT NULL,
        birth_date DATE NOT NULL,
        email TEXT NOT NULL UNIQUE,
        curp TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      `,
    })

    if (profilesError) throw profilesError

    // 2. Crear tabla de bicicletas
    const { error: bicyclesError } = await supabase.rpc("create_table_if_not_exists", {
      table_name: "bicycles",
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES profiles(id),
        serial_number TEXT NOT NULL UNIQUE,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        color TEXT NOT NULL,
        characteristics TEXT,
        registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        payment_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      `,
    })

    if (bicyclesError) throw bicyclesError

    // 3. Crear tabla de imágenes
    const { error: imagesError } = await supabase.rpc("create_table_if_not_exists", {
      table_name: "bicycle_images",
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        bicycle_id UUID NOT NULL REFERENCES bicycles(id),
        image_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      `,
    })

    if (imagesError) throw imagesError

    // 4. Crear tabla de pagos
    const { error: paymentsError } = await supabase.rpc("create_table_if_not_exists", {
      table_name: "payments",
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES profiles(id),
        bicycle_id UUID NOT NULL REFERENCES bicycles(id),
        stripe_payment_id TEXT,
        amount INTEGER NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      `,
    })

    if (paymentsError) throw paymentsError

    // 5. Crear políticas de seguridad RLS (Row Level Security)
    // Aquí se configurarían las políticas de seguridad para cada tabla

    return new Response(JSON.stringify({ success: true, message: "Base de datos configurada correctamente" }), {
      status: 200,
    })
  } catch (error) {
    console.error("Error al configurar la base de datos:", error)
    return new Response(JSON.stringify({ error: "Error al configurar la base de datos", details: error }), {
      status: 500,
    })
  }
}
