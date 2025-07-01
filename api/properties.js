export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const neighborhoods = [
    'Willow Glen, San Jose, CA',
    'Cambrian, San Jose, CA', 
    'Los Gatos, CA',
    'Cupertino, CA',
    'Palo Alto, CA',
    'Menlo Park, CA',
    'Mountain View, CA',
    'San Mateo, CA',
    'San Carlos, CA',
    'Belmont, CA'
  ];
  
  console.log(`Fetching properties from ${neighborhoods.length} neighborhoods...`);
  
  try {
    // Fetch from all neighborhoods in parallel
    const promises = neighborhoods.map(location => 
      fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `https://${req.headers.host}`}/api/zillow-search?location=${encodeURIComponent(location)}&priceMin=1800000&priceMax=2300000`)
        .then(r => r.json())
        .catch(err => {
          console.error(`Error fetching ${location}:`, err);
          return { results: [] };
        })
    );
    
    const results = await Promise.all(promises);
    
    // Combine all properties
    const allProperties = results.flatMap((r, idx) => {
      const properties = r.results || [];
      console.log(`${neighborhoods[idx]}: ${properties.length} properties`);
      return properties.map(prop => ({
        ...prop,
        neighborhood: neighborhoods[idx].split(',')[0] // Add neighborhood name
      }));
    });
    
    // Dedupe by zpid
    const uniqueProperties = allProperties.filter((prop, index, self) => 
      index === self.findIndex(p => p.zpid === prop.zpid)
    );
    
    // Sort by price (optional)
    uniqueProperties.sort((a, b) => (b.price || 0) - (a.price || 0));
    
    console.log(`Total unique properties: ${uniqueProperties.length}`);
    
    res.status(200).json({ 
      results: uniqueProperties,
      totalCount: uniqueProperties.length,
      neighborhoodCounts: results.map((r, idx) => ({
        name: neighborhoods[idx],
        count: r.results?.length || 0
      }))
    });
  } catch (error) {
    console.error('Properties API error:', error);
    res.status(500).json({ error: error.message });
  }
}