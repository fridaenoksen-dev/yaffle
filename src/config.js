// Fra Supabase: "Connect"-knappen øverst (Project URL) og Project Settings → API Keys (Publishable key).
// Publishable-nøkkelen er laget for å ligge i nettleseren. Det er reglene i
// supabase/schema.sql (Row Level Security) som stopper uvedkommende.
// Bruk ALDRI secret-nøkkelen (sb_secret_…) her.
export const SUPABASE_URL = "https://lbslhgawkujpuodbtozy.supabase.co";
export const SUPABASE_ANON_KEY =
  "sb_publishable_iEzz9gfKaVPcI2aoneSvKg_RMAbL2xF";
export const BUCKET = "receipts";
