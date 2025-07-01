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
    // Use fetch to call Supabase REST API directly
    const { SUPABASE_URL, SUPABASE_KEY } = process.env;
    
    // First, upsert the property
    const propertyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/properties`,
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
          address: propertyData.address,
          city: propertyData.city,
          price: propertyData.price,
          beds: propertyData.beds,
          baths: propertyData.baths,
          sqft: propertyData.sqft,
          image_url: propertyData.image,
          raw_data: propertyData
        })
      }
    );

    const [property] = await propertyResponse.json();
    
    // Then record the swipe
    const swipeResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/swipes`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          property_id: property.id,
          user_email: userEmail,
          vote
        })
      }
    );

    if (!swipeResponse.ok) {
      throw new Error('Failed to save swipe');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: error.message });
  }
}