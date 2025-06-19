-- Actualizar tabla de suscripciones para incluir los nuevos campos
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS bicycle_limit INTEGER DEFAULT 1;

-- Actualizar tabla de bicicletas para incluir los nuevos campos
ALTER TABLE bicycles 
ADD COLUMN IF NOT EXISTS bike_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS wheel_size VARCHAR(20),
ADD COLUMN IF NOT EXISTS groupset VARCHAR(100);

-- Crear tabla de reportes de robo si no existe
CREATE TABLE IF NOT EXISTS theft_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bicycle_id UUID REFERENCES bicycles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location TEXT,
  description TEXT,
  police_report_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'reported',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en theft_reports
ALTER TABLE theft_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para theft_reports
CREATE POLICY "Users can view their own theft reports" ON theft_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create theft reports for their bicycles" ON theft_reports
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM bicycles WHERE id = bicycle_id AND user_id = auth.uid())
  );

-- Actualizar suscripciones existentes con valores por defecto
UPDATE subscriptions 
SET plan_type = 'basic', bicycle_limit = 1 
WHERE plan_type IS NULL OR bicycle_limit IS NULL;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bicycles_user_id ON bicycles(user_id);
CREATE INDEX IF NOT EXISTS idx_theft_reports_bicycle_id ON theft_reports(bicycle_id);
