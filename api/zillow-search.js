// api/zillow-search.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get location from query params
    const { location = 'Palo Alto, CA', priceMin = '1800000', priceMax = '2300000' } = req.query;
    
    console.log('API Request:', { location, priceMin, priceMax });
    console.log('Has API Key:', !!process.env.RAPIDAPI_KEY);
    
    // Check if API key exists
    if (!process.env.RAPIDAPI_KEY) {
      return res.status(500).json({ 
        error: 'API configuration error',
        message: 'RAPIDAPI_KEY environment variable is not set'
      });
    }
    
    // Build URL
    const url = new URL('https://zillow56.p.rapidapi.com/search');
    url.searchParams.append('location', location);
    url.searchParams.append('status', 'forSale');
    url.searchParams.append('price_min', priceMin);
    url.searchParams.append('price_max', priceMax);
    
    console.log('Fetching from:', url.toString());
    
    // Make request to Zillow API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'zillow56.p.rapidapi.com'
      }
    });
    
    console.log('Zillow Response Status:', response.status);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zillow API Error:', errorText);
      return res.status(response.status).json({ 
        error: 'Zillow API error',
        status: response.status,
        message: errorText.substring(0, 200)
      });
    }
    
    // Parse response
    const data = await response.json();
    console.log('Properties found:', data.totalResultCount || 0);
    
    // Return data
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Handler Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error.message,
      stack: error.stack
    });
  }
}