import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jowylgmfrvrjmurnlqgq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvd3lsZ21mcnZyam11cm5scWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDQzMTUsImV4cCI6MjA4NjgyMDMxNX0.XmAf8pHI3ZWPU8yYD5skCRjxDhclPzz1gp1bT6_9ZDE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});