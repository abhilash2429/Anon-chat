import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Check if configured correctly
const isConfigured =
    isValidUrl(supabaseUrl) &&
    supabaseUrl !== 'your-project-url' &&
    supabaseAnonKey !== 'your-anon-key';

if (!isConfigured) {
    console.warn('Supabase is not configured properly. Using fallback to prevent crash. Check .env.local');
}

// Initialize with real credentials or safe fallbacks to prevent initialization crash
export const supabase = createClient(
    isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
    isConfigured ? supabaseAnonKey : 'placeholder'
);
