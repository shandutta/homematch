export default async function handler(req, res) {
  console.log('API function called');
  console.log('Has API key?', !!process.env.RAPIDAPI_KEY);
  
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not found in environment' });
    }
    
    const url = 'https://zillow56.p.rapidapi.com/search?location=Palo%20Alto%2C%20CA&status=forSale';
    console.log('Fetching:', url);
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'zillow56.p.rapidapi.com'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zillow error:', errorText);
      return res.status(500).json({ 
        error: 'Zillow API error', 
        status: response.status,
        details: errorText.substring(0, 100) 
      });
    }
    
    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Catch error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch data', 
      details: error.message,
      hasKey: !!process.env.RAPIDAPI_KEY 
    });
  }
}