import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const selectedAvatar = formData.get('selectedAvatar');
    const selectedIcon = formData.get('selectedIcon');
    const customAvatar = formData.get('customAvatar') as File | null;
    const customIcon = formData.get('customIcon') as File | null;

    const settings: any = {
      businessId,
      selectedAvatar,
      selectedIcon,
      updatedAt: new Date().toISOString(),
    };

    if (customAvatar) {
      settings.customAvatarUrl = `custom-avatar-${Date.now()}`;
    }

    if (customIcon) {
      settings.customIconUrl = `custom-icon-${Date.now()}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${businessId}/avatar-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.headers.get('authorization')}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to save avatar settings');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving avatar settings:', error);
    return NextResponse.json({ error: 'Failed to save avatar settings' }, { status: 500 });
  }
}
