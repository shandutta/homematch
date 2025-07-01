// api/zillow-search.js - Simplified version with fewer filters
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
    // Get parameters - only essential ones
    const { 
      location = 'Palo Alto, CA', 
      priceMin = '1800000', 
      priceMax = '2300000',
      page = '1'
    } = req.query;
    
    console.log('API Request:', { location, priceMin, priceMax, page });
    
    // Check if API key exists
    if (!process.env.RAPIDAPI_KEY) {
      return res.status(500).json({ 
        error: 'API configuration error',
        message: 'RAPIDAPI_KEY environment variable is not set'
      });
    }
    
    // Build URL with minimal parameters
    const url = new URL('https://zillow56.p.rapidapi.com/search');
    url.searchParams.append('location', location);
    url.searchParams.append('status', 'forSale');
    url.searchParams.append('price_min', priceMin);
    url.searchParams.append('price_max', priceMax);
    
    // Only add page if it's not page 1
    if (page !== '1') {
      url.searchParams.append('page', page);
    }
    
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
    console.log('Raw results count:', data.results?.length || 0);
    console.log('Total result count:', data.totalResultCount || 0);
    
    // Simple pagination info
    const resultsPerPage = data.results?.length || 0;
    const totalResults = data.totalResultCount || resultsPerPage;
    const currentPageNum = parseInt(page);
    const estimatedTotalPages = Math.ceil(totalResults / (resultsPerPage || 10));
    
    // Add pagination info
    const enhancedData = {
      ...data,
      pagination: {
        currentPage: currentPageNum,
        totalPages: estimatedTotalPages,
        hasMore: currentPageNum < estimatedTotalPages,
        totalResults: totalResults,
        resultsThisPage: resultsPerPage
      }
    };
    
    console.log('Enhanced data:', {
      resultsReturned: resultsPerPage,
      pagination: enhancedData.pagination
    });
    
    // Return enhanced data
    res.status(200).json(enhancedData);
    
  } catch (error) {
    console.error('Handler Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error.message
    });
  }
}