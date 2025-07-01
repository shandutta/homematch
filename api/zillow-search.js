// api/zillow-search.js
export default async function handler(req, res) {
  try {
    const { location = 'Palo Alto, CA' } = req.query;
    
    // First, let's test if the function runs at all
    if (!process.env.RAPIDAPI_KEY) {
      return res.status(500).json({ 
        error: 'RAPIDAPI_KEY not found in environment variables' 
      });
    }
    
    const response = await fetch(
      `https://zillow56.p.rapidapi.com/search?location=${encodeURIComponent(location)}&status=forSale`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'zillow56.p.rapidapi.com'
        }
      }
    );
    
    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error.message 
    });
  }
}