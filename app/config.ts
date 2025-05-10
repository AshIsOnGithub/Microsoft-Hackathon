// This file exports environment variables for use in client components
// Values are available at build time through Next.js's build system

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Add additional environment variables as needed
export const apiConfig = {
  azureSpeechRegion: process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION,
  azureTranslatorRegion: process.env.NEXT_PUBLIC_AZURE_TRANSLATOR_REGION,
};

// Validate config during build
if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
} 