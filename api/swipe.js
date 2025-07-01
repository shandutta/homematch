// api/swipe.js
// Save swipe decisions to Supabase with better error handling

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { zpid, vote, propertyData, userEmail = 'default@homematch.com' } = req.body;
    
    console.log('Swipe received:', { zpid, vote, userEmail });
    
    // Validate required fields
    if (!zpid) {
      console.error('Missing zpid');
      return res.status(400).json({ error: 'Missing property ID (zpid)' });
    }
    
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.error('Supabase not configured');
      return res.status(200).json({
        success: true,
        message: 'Swipe logged (Supabase not configured)',
        zpid,
        vote
      });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    // Clean up property data - ensure all values are valid
    const cleanPropertyData = {
      zpid: String(zpid),
      address: propertyData.address || 'Unknown Address',
      city: propertyData.city || 'Unknown City',
      price: parseInt(propertyData.price) || 0,
      beds: parseInt(propertyData.beds) || 0,
      baths: parseFloat(propertyData.baths) || 0,
      sqft: parseInt(propertyData.sqft) || 0,
      image_url: propertyData.image || '',
      match_score: parseFloat(propertyData.match) || 0,
      raw_data: propertyData,
      updated_at: new Date().toISOString()
    };
    
    console.log('Saving property:', cleanPropertyData);
    
    // First, save or update the property
    const propertyResponse = await fetch(
      `${supabaseUrl}/rest/v1/properties?zpid=eq.${cleanPropertyData.zpid}`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );
    
    let propertyId;
    
    if (propertyResponse.ok) {
      const existingProperties = await propertyResponse.json();
      
      if (existingProperties.length > 0) {
        // Property exists, update it
        propertyId = existingProperties[0].id;
        console.log('Updating existing property:', propertyId);
        
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/properties?zpid=eq.${cleanPropertyData.zpid}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(cleanPropertyData)
          }
        );
        
        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          console.error('Error updating property:', error);
          throw new Error('Failed to update property');
        }
      } else {
        // Property doesn't exist, create it
        console.log('Creating new property');
        
        const createResponse = await fetch(
          `${supabaseUrl}/rest/v1/properties`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(cleanPropertyData)
          }
        );
        
        if (!createResponse.ok) {
          const error = await createResponse.text();
          console.error('Error creating property:', error);
          throw new Error('Failed to create property');
        }
        
        const newProperty = await createResponse.json();
        propertyId = newProperty[0].id;
      }
    } else {
      const error = await propertyResponse.text();
      console.error('Error checking property:', error);
      throw new Error('Failed to check property');
    }
    
    // Now save or update the swipe
    console.log('Saving swipe for property:', propertyId);
    
    // First check if swipe exists
    const swipeCheckResponse = await fetch(
      `${supabaseUrl}/rest/v1/swipes?property_id=eq.${propertyId}&user_email=eq.${userEmail}`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );
    
    if (swipeCheckResponse.ok) {
      const existingSwipes = await swipeCheckResponse.json();
      
      if (existingSwipes.length > 0) {
        // Update existing swipe
        console.log('Updating existing swipe');
        
        const updateSwipeResponse = await fetch(
          `${supabaseUrl}/rest/v1/swipes?property_id=eq.${propertyId}&user_email=eq.${userEmail}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              vote: vote,
              swiped_at: new Date().toISOString()
            })
          }
        );
        
        if (!updateSwipeResponse.ok) {
          const error = await updateSwipeResponse.text();
          console.error('Error updating swipe:', error);
          throw new Error('Failed to update swipe');
        }
      } else {
        // Create new swipe
        console.log('Creating new swipe');
        
        const createSwipeResponse = await fetch(
          `${supabaseUrl}/rest/v1/swipes`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              property_id: propertyId,
              user_email: userEmail,
              vote: vote,
              swiped_at: new Date().toISOString()
            })
          }
        );
        
        if (!createSwipeResponse.ok) {
          const error = await createSwipeResponse.text();
          console.error('Error creating swipe:', error);
          throw new Error('Failed to create swipe');
        }
      }
    }
    
    console.log('Swipe saved successfully');
    
    res.status(200).json({
      success: true,
      message: 'Swipe saved to Supabase',
      zpid,
      vote,
      propertyId
    });
    
  } catch (error) {
    console.error('Swipe API Error:', error);
    console.error('Request body:', req.body);
    
    res.status(500).json({ 
      error: 'Failed to save swipe',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}