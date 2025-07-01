// api/test-minimal.js - Absolute minimal test
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Just return success
  res.status(200).json({
    success: true,
    message: 'Minimal API works',
    timestamp: new Date().toISOString()
  });
}