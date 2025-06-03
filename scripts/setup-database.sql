-- Verificar si existe la tabla de suscripciones
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
);

-- Crear tabla de suscripciones si no existe
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

-- Crear políticas RLS para la tabla de suscripciones
DO $$
BEGIN
  -- Eliminar políticas existentes
  DROP POLICY IF EXISTS "Usuarios pueden ver sus propias suscripciones" ON subscriptions;
  DROP POLICY IF EXISTS "Administradores pueden ver todas las suscripciones" ON subscriptions;
  DROP POLICY IF EXISTS "API puede insertar suscripciones" ON subscriptions;
  DROP POLICY IF EXISTS "API puede actualizar suscripciones" ON subscriptions;
  
  -- Habilitar RLS
  ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  
  -- Crear nuevas políticas
  CREATE POLICY "Usuarios pueden ver sus propias suscripciones" 
    ON subscriptions FOR SELECT 
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Administradores pueden ver todas las suscripciones" 
    ON subscriptions FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    
  CREATE POLICY "API puede insertar suscripciones" 
    ON subscriptions FOR INSERT 
    WITH CHECK (true);
    
  CREATE POLICY "API puede actualizar suscripciones" 
    ON subscriptions FOR UPDATE 
    USING (true);
END
$$;
