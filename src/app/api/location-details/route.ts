
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    const geoApiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    
    const response = await fetch(geoApiUrl, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'LabWiseApp/1.0 (contact@labwise.app)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Nominatim API: ${response.statusText}`);
    }

    const data = await response.json();
    
    const city = data.address.city || data.address.town || data.address.village || 'Unknown City';
    const country = data.address.country || 'Unknown Country';

    return NextResponse.json({ city, country });

  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve location details' }, { status: 500 });
  }
}
