/**
 * Frontend Geo Detection Utility
 * Fetches user's detected country and dialect from backend API
 */

export interface GeoData {
  country: string;
  city?: string;
  dialect: string;
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Detect user's region from IP address (via backend)
 * Caches result in sessionStorage for 1 hour
 */
export async function detectUserRegion(): Promise<GeoData> {
  // Check cache first
  const cached = sessionStorage.getItem('fahimo_geo');
  if (cached) {
    try {
      const data = JSON.parse(cached);
      const age = Date.now() - new Date(data.timestamp).getTime();
      if (age < 3600000) { // 1 hour
        return data;
      }
    } catch (e) {
      // Invalid cache, proceed with fresh detection
    }
  }

  try {
    const response = await fetch(`${API_URL}/api/geo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies for session
    });

    if (!response.ok) {
      throw new Error(`Geo detection failed: ${response.status}`);
    }

    const data: GeoData = await response.json();

    // Cache for 1 hour
    sessionStorage.setItem('fahimo_geo', JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Failed to detect user region:', error);
    
    // Default to Saudi Arabia
    return {
      country: 'SA',
      dialect: 'sa',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Map dialect to display name
 */
export function getDialectName(dialect: string): string {
  const names: Record<string, string> = {
    sa: 'السعودية',
    eg: 'مصرية',
    ae: 'إماراتية',
    kw: 'كويتية',
    gulf: 'خليجية',
    lev: 'شامية',
    maghreb: 'مغاربية',
    msa: 'عربية فصحى',
    en: 'English',
  };

  return names[dialect] || dialect;
}

/**
 * Get country flag emoji
 */
export function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    SA: '🇸🇦', EG: '🇪🇬', AE: '🇦🇪', KW: '🇰🇼',
    BH: '🇧🇭', OM: '🇴🇲', QA: '🇶🇦',
    JO: '🇯🇴', LB: '🇱🇧', SY: '🇸🇾', PS: '🇵🇸',
    MA: '🇲🇦', DZ: '🇩🇿', TN: '🇹🇳', LY: '🇱🇾',
    IQ: '🇮🇶', YE: '🇾🇪', SD: '🇸🇩',
  };

  return flags[country] || '🌍';
}
