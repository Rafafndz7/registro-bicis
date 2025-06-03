import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    console.log("Verificando y creando tabla de suscripciones...")

    // Verificar si la tabla existe
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "subscriptions")

    if (tablesError) {
      console.error("Error al verificar tablas:", tablesError)
    }

    console.log("Tablas encontradas:", tables)

    // Intentar crear la tabla si no existe
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT UNIQUE,
        status TEXT NOT NULL,
        current_period_start TIMESTAMP WITH TIME ZONE,
        current_period_end TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: createTableQuery,
    })

    if (createError) {
      console.error("Error al crear tabla:", createError)
      return NextResponse.json(
        {
          error: "Error al crear tabla",
          details: createError.message,
        },
        { status: 500 },
      )
    }

    // Habilitar RLS
    const rlsQuery = `
      ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Usuarios pueden ver sus propias suscripciones" ON subscriptions;
      DROP POLICY IF EXISTS "API puede insertar suscripciones" ON subscriptions;
      DROP POLICY IF EXISTS "API puede actualizar suscripciones" ON subscriptions;
      
      CREATE POLICY "Usuarios pueden ver sus propias suscripciones" 
        ON subscriptions FOR SELECT 
        USING (auth.uid() = user_id);
        
      CREATE POLICY "API puede insertar suscripciones" 
        ON subscriptions FOR INSERT 
        WITH CHECK (true);
        
      CREATE POLICY "API puede actualizar suscripciones" 
        ON subscriptions FOR UPDATE 
        USING (true);
    `

    const { error: rlsError } = await supabase.rpc("exec_sql", {
      sql: rlsQuery,
    })

    if (rlsError) {
      console.error("Error al configurar RLS:", rlsError)
    }

    console.log("Tabla de suscripciones configurada correctamente")

    return NextResponse.json({
      success: true,
      message: "Tabla de suscripciones configurada correctamente",
    })
  } catch (error) {
    console.error("Error al configurar base de datos:", error)
    return NextResponse.json(
      {
        error: "Error al configurar base de datos",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
