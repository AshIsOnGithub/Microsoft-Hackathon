import { NextRequest, NextResponse } from 'next/server';

// Default Azure Speech region if not specified in environment
const DEFAULT_SPEECH_REGION = 'eastus';

/**
 * API endpoint to generate Azure Speech Service token
 * This token is used for both speech-to-text and text-to-speech on the client side
 */
export async function GET(request: NextRequest) {
  try {
    // Log for debugging
    console.log('Azure Speech Token API called');
    
    // Get Azure Speech key and region from environment variables
    const speechKey = process.env.AZURE_SPEECH_KEY || '';
    const speechRegion = process.env.AZURE_SPEECH_REGION || DEFAULT_SPEECH_REGION;
    
    console.log(`Speech key available: ${speechKey ? 'Yes' : 'No'}`);
    console.log(`Speech region: ${speechRegion}`);
    
    if (!speechKey) {
      console.log('Azure Speech key is not configured, switching to demo mode');
      return NextResponse.json({ 
        token: 'demo-token',
        region: speechRegion,
        mode: 'demo'
      });
    }
    
    // For demo purposes, if Azure Speech key is set to DEMO_MODE
    if (speechKey === 'DEMO_MODE') {
      console.log('Using demo mode for speech services');
      return NextResponse.json({ 
        token: 'demo-token',
        region: speechRegion,
        mode: 'demo'
      });
    }
    
    try {
      // Azure Speech token endpoint
      const tokenEndpoint = `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
      console.log(`Requesting token from: ${tokenEndpoint}`);
      
      // Request token from Azure
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Azure Speech token error: ${response.status} - ${errorText}`);
        
        // Fall back to demo mode if token request fails
        return NextResponse.json({ 
          token: 'demo-token',
          region: speechRegion,
          mode: 'demo',
          error: `Failed to get token: ${response.status}`
        });
      }
      
      // Get token as plain text
      const token = await response.text();
      console.log('Successfully obtained Azure Speech token');
      
      // Return token and region to the client
      return NextResponse.json({
        token,
        region: speechRegion,
        mode: 'azure'
      });
    } catch (fetchError) {
      console.error('Error fetching Azure Speech token:', fetchError);
      
      // Fall back to demo mode if there's a network error
      return NextResponse.json({ 
        token: 'demo-token',
        region: speechRegion,
        mode: 'demo',
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
      });
    }
  } catch (error) {
    console.error('Unexpected error in Azure Speech token API:', error);
    
    // Fall back to demo mode for any unexpected errors
    return NextResponse.json({ 
      token: 'demo-token',
      region: DEFAULT_SPEECH_REGION,
      mode: 'demo',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 