import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type Props = {
  params: { userId: string }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Default metadata
  const defaultMetadata: Metadata = {
    title: 'Medical Profile | SympCheck',
    description: 'View shared medical profile information including allergies and medical history.',
  };

  try {
    // Create Supabase server client
    const supabase = createServerComponentClient({ cookies });
    
    // Fetch basic profile data for title
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', params.userId)
      .maybeSingle();
    
    if (!profileData) {
      return defaultMetadata;
    }
    
    // Return metadata with user's name
    return {
      title: `${profileData.full_name}'s Medical Profile | SympCheck`,
      description: 'View shared medical profile information including allergies and medical history.',
      openGraph: {
        title: `${profileData.full_name}'s Medical Profile | SympCheck`,
        description: 'View shared medical profile information including allergies and medical history.',
        type: 'profile',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return defaultMetadata;
  }
} 