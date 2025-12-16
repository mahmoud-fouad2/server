import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const businessId = request.headers.get('x-business-id');
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const selectedAvatar = formData.get('selectedAvatar');
    const selectedIcon = formData.get('selectedIcon');
    const customAvatar = formData.get('customAvatar');
    const customIcon = formData.get('customIcon');

    const settings = {
      businessId,
      selectedAvatar,
      selectedIcon,
      updatedAt: new Date().toISOString(),
    };

    // If custom files are provided, they would normally be uploaded to cloud storage
    // For now, we'll save the settings and store file references
    if (customAvatar) {
      // TODO: Upload to S3 or Cloudinary
      settings.customAvatarUrl = `custom-avatar-${Date.now()}`;
    }
    
    if (customIcon) {
      // TODO: Upload to S3 or Cloudinary
      settings.customIconUrl = `custom-icon-${Date.now()}`;
    }

    // Save to database via API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business/${businessId}/avatar-settings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.headers.get('authorization')}`,
        },
        body: JSON.stringify(settings),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to save avatar settings');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving avatar settings:', error);
    return NextResponse.json(
      { error: 'Failed to save avatar settings' },
      { status: 500 }
    );
  }
}
