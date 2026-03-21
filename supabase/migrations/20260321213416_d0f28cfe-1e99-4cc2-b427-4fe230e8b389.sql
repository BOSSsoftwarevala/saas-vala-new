
-- ============================================
-- Reseller SEO Runs Table
-- ============================================
CREATE TABLE public.reseller_seo_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reseller_seo_runs_user ON public.reseller_seo_runs(user_id);
CREATE INDEX idx_reseller_seo_runs_created ON public.reseller_seo_runs(created_at DESC);

-- RLS
ALTER TABLE public.reseller_seo_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SEO runs"
  ON public.reseller_seo_runs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own SEO runs"
  ON public.reseller_seo_runs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- Reseller Campaigns Table (Ads & Lead Gen)
-- ============================================
CREATE TABLE public.reseller_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'google_ads',
  budget NUMERIC(10,2) NOT NULL DEFAULT 25,
  target_audience TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  leads_count INT NOT NULL DEFAULT 0,
  impressions INT NOT NULL DEFAULT 0,
  spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reseller_campaigns_user ON public.reseller_campaigns(user_id);
CREATE INDEX idx_reseller_campaigns_status ON public.reseller_campaigns(status);
CREATE INDEX idx_reseller_campaigns_created ON public.reseller_campaigns(created_at DESC);

-- RLS
ALTER TABLE public.reseller_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON public.reseller_campaigns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own campaigns"
  ON public.reseller_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns"
  ON public.reseller_campaigns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admins can view all
CREATE POLICY "Admins can view all SEO runs"
  ON public.reseller_seo_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view all campaigns"
  ON public.reseller_campaigns FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Updated_at trigger for campaigns
CREATE TRIGGER update_reseller_campaigns_updated_at
  BEFORE UPDATE ON public.reseller_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
