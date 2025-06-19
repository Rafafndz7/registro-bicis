-- Crear extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  birth_date DATE,
  email TEXT NOT NULL,
  curp TEXT,
  address TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de bicicletas con nuevos campos
CREATE TABLE IF NOT EXISTS bicycles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT NOT NULL,
  characteristics TEXT,
  bike_type TEXT NOT NULL DEFAULT 'montaña', -- montaña, ruta, urbana, híbrida
  year INTEGER, -- año de la bicicleta
  wheel_size TEXT, -- rodada: 26", 27.5", 29", 700c, etc.
  groupset TEXT, -- grupo: Shimano Altus, SRAM GX, etc.
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_status BOOLEAN DEFAULT FALSE,
  theft_status TEXT DEFAULT 'not_reported', -- not_reported, reported_stolen, recovered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de imágenes de bicicletas
CREATE TABLE IF NOT EXISTS bicycle_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bicycle_id UUID REFERENCES bicycles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  bicycle_id UUID REFERENCES bicycles(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  amount INTEGER NOT NULL, -- en centavos
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
  payment_type TEXT DEFAULT 'bicycle_registration', -- bicycle_registration, subscription
  subscription_id UUID,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de suscripciones con nuevos planes
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'basic', -- basic(1), standard(2), family(4), premium(6)
  bicycle_limit INTEGER NOT NULL DEFAULT 1, -- límite de bicicletas según el plan
  status TEXT DEFAULT 'active', -- active, inactive, canceled
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reportes de robo
CREATE TABLE IF NOT EXISTS theft_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bicycle_id UUID REFERENCES bicycles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location TEXT,
  description TEXT,
  police_report_number TEXT,
  status TEXT DEFAULT 'reported', -- reported, investigating, recovered, closed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_bicycles_user_id ON bicycles(user_id);
CREATE INDEX IF NOT EXISTS idx_bicycles_serial_number ON bicycles(serial_number);
CREATE INDEX IF NOT EXISTS idx_bicycle_images_bicycle_id ON bicycle_images(bicycle_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_theft_reports_bicycle_id ON theft_reports(bicycle_id);

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bicycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bicycle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE theft_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para bicycles
CREATE POLICY "Users can view own bicycles" ON bicycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bicycles" ON bicycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bicycles" ON bicycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bicycles" ON bicycles FOR DELETE USING (auth.uid() = user_id);

-- Políticas para bicycle_images
CREATE POLICY "Users can view images of own bicycles" ON bicycle_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM bicycles WHERE bicycles.id = bicycle_images.bicycle_id AND bicycles.user_id = auth.uid())
);
CREATE POLICY "Users can insert images for own bicycles" ON bicycle_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM bicycles WHERE bicycles.id = bicycle_images.bicycle_id AND bicycles.user_id = auth.uid())
);
CREATE POLICY "Users can delete images of own bicycles" ON bicycle_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM bicycles WHERE bicycles.id = bicycle_images.bicycle_id AND bicycles.user_id = auth.uid())
);

-- Políticas para payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para theft_reports
CREATE POLICY "Users can view own theft reports" ON theft_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own theft reports" ON theft_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own theft reports" ON theft_reports FOR UPDATE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bicycles_updated_at BEFORE UPDATE ON bicycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_theft_reports_updated_at BEFORE UPDATE ON theft_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Agregar columnas a tablas existentes si no existen
DO $$ 
BEGIN
  -- Agregar nuevos campos a bicycles si no existen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bicycles' AND column_name = 'bike_type') THEN
    ALTER TABLE bicycles ADD COLUMN bike_type TEXT NOT NULL DEFAULT 'montaña';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bicycles' AND column_name = 'year') THEN
    ALTER TABLE bicycles ADD COLUMN year INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bicycles' AND column_name = 'wheel_size') THEN
    ALTER TABLE bicycles ADD COLUMN wheel_size TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bicycles' AND column_name = 'groupset') THEN
    ALTER TABLE bicycles ADD COLUMN groupset TEXT;
  END IF;
  
  -- Agregar nuevos campos a subscriptions si no existen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan_type') THEN
    ALTER TABLE subscriptions ADD COLUMN plan_type TEXT NOT NULL DEFAULT 'basic';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'bicycle_limit') THEN
    ALTER TABLE subscriptions ADD COLUMN bicycle_limit INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;
