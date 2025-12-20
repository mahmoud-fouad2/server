declare module 'geoip-lite' {
  interface GeoData {
    range: [number, number];
    country: string;
    region: string;
    eu: string;
    timezone: string;
    city: string;
    ll: [number, number];
    metro: number;
    area: number;
  }

  export function lookup(ip: string): GeoData | null;
  export function pretty(ip: string): string;
  export function startWatchingDataUpdate(callback?: () => void): void;
  export function stopWatchingDataUpdate(): void;
}
