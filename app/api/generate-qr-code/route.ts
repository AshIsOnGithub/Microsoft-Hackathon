import { NextRequest, NextResponse } from 'next/server';

const QR_CODE_API_KEY = 'Nz8ie9BaY2wepp45yjkOVPxRHboqiprBVC3NlZtxvTdbYtNLpP4609sQA5Mg9fu3';
const QR_CODE_API_URL = 'https://api.qr-code-generator.com/v1/create';

export async function POST(req: NextRequest) {
  try {
    const { url, name = 'Medical Profile' } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Create request body for QR code API
    const requestBody = {
      frame_name: "no-frame",
      qr_code_text: url,
      image_format: "SVG",
      qr_code_logo: "scan-me-square",
      background_color: "#FFFFFF",
      foreground_color: "#000000"
    };

    // Send request to QR code API
    const response = await fetch(`${QR_CODE_API_URL}?access-token=${QR_CODE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('QR code API error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to generate QR code' },
        { status: response.status }
      );
    }

    // Get SVG content from response
    const svgContent = await response.text();
    
    // Create a data URL from SVG content for easier embedding
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

    return NextResponse.json({ qrCodeUrl: dataUrl });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
} 