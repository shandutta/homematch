// api/test.js
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API works!',
    hasKey: !!process.env.RAPIDAPI_KEY,
    timestamp: new Date().toISOString()
  });
}