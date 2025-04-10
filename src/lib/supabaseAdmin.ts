import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // The service role key

// This client is used for admin tasks (e.g., deleting users)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
