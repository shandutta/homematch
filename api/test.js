export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API works!',
    hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
    timestamp: new Date().toISOString()
  });
}