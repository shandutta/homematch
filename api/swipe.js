export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { zpid, vote, propertyData, userEmail = 'shan@example.com' } = req.body;

  try {
    const { SUPABASE_URL, SUPABASE_KEY } = process.env;
    
    // First, upsert the property
    const propertyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?zpid=eq.${zpid}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          zpid: String(zpid),
          address: propertyData.address || 'Unknown',
          city: propertyData.city || 'Unknown',
          price: propertyData.price || 0,
          beds: propertyData.beds || 0,
          baths: propertyData.baths || 0,
          sqft: propertyData.sqft || 0,
          image_url: propertyData.image || '',
          raw_data: propertyData
        })
      }
    );

    const propertyResult = await propertyResponse.json();
    // FIX: Handle both array and single object responses
    const property = Array.isArray(propertyResult) ? propertyResult[0] : propertyResult;
    
    if (!property || !property.id) {
      throw new Error('Failed to upsert property');
    }

    // Then record the swipe
    const swipeResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/swipes`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          property_id: property.id,
          user_email: userEmail,
          vote
        })
      }
    );

    if (!swipeResponse.ok) {
      const error = await swipeResponse.text();
      throw new Error(`Failed to save swipe: ${error}`);
    }

    res.status(200).json({ success: true, propertyId: property.id });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: error.message });
  }
}