-- Apply before deploying. No changes to app code or saved user data.
CREATE TABLE IF NOT EXISTS public.app_appearance (
  app_id uuid PRIMARY KEY REFERENCES public.apps(id) ON DELETE CASCADE,
  icon text NOT NULL DEFAULT 'calendar',
  color text NOT NULL DEFAULT 'mist',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_appearance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_appearance FROM anon, authenticated;
GRANT ALL ON public.app_appearance TO service_role;
