// supabase-config.js
// 1. Load the official Supabase engine from a secure online delivery network (CDN)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 2. Paste your specific Supabase credentials from your Data API settings page
const supabaseUrl = 'https://vyrurccfhlxnqapfaiur.supabase.co'
const supabaseKey = 'sb_publishable_3EDdXxkjpKNSBl-NoIc5lQ_xKgXMJfe'

// 3. Connect and export the initialized client to share across your scripts
export const supabase = createClient(supabaseUrl, supabaseKey)
