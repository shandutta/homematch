export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // In api/properties.js, accept neighborhoods from query params
    const { neighborhoods } = req.query;
    const neighborhoodList = neighborhoods 
        ? JSON.parse(neighborhoods) 
        : ['Palo Alto, CA', 'Menlo Park, CA']; // default fallback
    
    // Fetch one at a time to see which fails
    const results = [];
    for (const location of neighborhoodList) {
      try {
        const url = `https://${req.headers.host}/api/zillow-search?location=${encodeURIComponent(location)}&priceMin=1800000&priceMax=2300000`;
        console.log('Fetching:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`${location}: ${data.results?.length || 0} properties`);
        results.push(data);
      } catch (err) {
        console.error(`Failed to fetch ${location}:`, err);
        results.push({ results: [] });
      }
    }
    
    const allProperties = results.flatMap(r => r.results || []);
    
    res.status(200).json({ 
      results: allProperties,
      totalCount: allProperties.length,
      debug: {
        neighborhoodsTried: neighborhoodList.length,
        resultsPerNeighborhood: results.map(r => r.results?.length || 0)
      }
    });
  } catch (error) {
    console.error('Properties API error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}