import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const businessId = request.headers.get('x-business-id');
    const token = request.headers.get('authorization');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Forward FormData directly to backend API (preserves file uploads)
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com'}/api/business/${businessId}/avatar-settings`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
      },
      body: formData, // Send FormData directly with files
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving avatar settings:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save avatar settings' }, { status: 500 });
  }
}
