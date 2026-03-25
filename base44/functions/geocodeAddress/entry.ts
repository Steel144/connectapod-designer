import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { query, limit = 5 } = await req.json();

    if (!query || query.trim().length < 1) {
      return Response.json({ error: 'Query required' }, { status: 400 });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=nz&format=json&limit=${limit}&timeout=10`,
      {
        headers: {
          'User-Agent': 'Connectapod-App (connectapod.com)'
        }
      }
    );

    if (!response.ok) {
      return Response.json({ error: 'Geocoding service unavailable' }, { status: 503 });
    }

    const data = await response.json();
    return Response.json({ results: data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});