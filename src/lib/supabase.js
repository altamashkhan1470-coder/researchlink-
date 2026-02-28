import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://jowylgmfrvrjmurnlqgq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvd3lsZ21mcnZyam11cm5scWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDQzMTUsImV4cCI6MjA4NjgyMDMxNX0.XmAf8pHI3ZWPU8yYD5skCRjxDhclPzz1gp1bT6_9ZDE",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);