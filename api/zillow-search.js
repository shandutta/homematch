module.exports = async (req, res) => {
  const { location = 'Palo Alto, CA' } = req.query;
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(
      `https://zillow56.p.rapidapi.com/search?location=${encodeURIComponent(location)}&status=forSale&price_min=1800000&price_max=2300000`,
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
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};