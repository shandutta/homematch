// api/zillow-search.js - SECURE VERSION
import crypto from 'crypto';

// Simple in-memory rate limiter (use Vercel KV in production)
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // requests per minute per IP
const WINDOW_MS = 60000; // 1 minute

function getRateLimitKey(ip) {
  return `ratelimit:${ip}`;
}

function checkRateLimit(ip) {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const userRequests = rateLimitMap.get(key) || [];
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter(timestamp => now - timestamp < WINDOW_MS);
  
  if (validRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  return true;
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get client IP
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ 
      error: 'Too many requests',
      message: 'Please wait before making another request'
    });
  }

  // CORS - Restrict to your domain only
  const allowedOrigins = [
    'https://homematch-flax.vercel.app',
    'http://localhost:3000' // for development
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET');
  }

  try {
    // Validate and sanitize inputs
    const { location, priceMin, priceMax } = req.query;
    
    // Input validation
    if (!location || typeof location !== 'string') {
      return res.status(400).json({ error: 'Invalid location parameter' });
    }
    
    const minPrice = parseInt(priceMin) || 0;
    const maxPrice = parseInt(priceMax) || 10000000;
    
    if (minPrice < 0 || maxPrice < minPrice || maxPrice > 50000000) {
      return res.status(400).json({ error: 'Invalid price range' });
    }
    
    // Sanitize location to prevent injection
    const sanitizedLocation = location.replace(/[^a-zA-Z0-9\s,.-]/g, '').slice(0, 100);
    
    console.log('Zillow API Request:', { 
      location: sanitizedLocation,
      priceMin: minPrice,
      priceMax: maxPrice,
      ip: clientIp.slice(0, 15) // Log partial IP for debugging
    });
    
    // Check if API key exists
    if (!process.env.RAPIDAPI_KEY) {
      return res.status(500).json({ 
        error: 'API configuration error',
        message: 'Service temporarily unavailable'
      });
    }
    
    // Build URL with validated parameters
    const url = new URL('https://zillow56.p.rapidapi.com/search');
    url.searchParams.append('location', sanitizedLocation);
    url.searchParams.append('status', 'forSale');
    url.searchParams.append('price_min', minPrice.toString());
    url.searchParams.append('price_max', maxPrice.toString());
    
    // Make request to Zillow API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'zillow56.p.rapidapi.com'
      }
    });
    
    if (!response.ok) {
      console.error('Zillow API Error:', response.status);
      return res.status(502).json({ 
        error: 'External API error',
        message: 'Unable to fetch property data'
      });
    }
    
    // Parse response
    const data = await response.json();
    
    // Sanitize response data
    if (data.results && Array.isArray(data.results)) {
      data.results = data.results.map(property => ({
        ...property,
        // Ensure critical fields are present and sanitized
        streetAddress: (property.streetAddress || '').replace(/[<>]/g, ''),
        city: (property.city || '').replace(/[<>]/g, ''),
        zpid: property.zpid ? String(property.zpid) : null,
        price: parseInt(property.price) || 0,
        bedrooms: parseInt(property.bedrooms) || 0,
        bathrooms: parseFloat(property.bathrooms) || 0,
        livingArea: parseInt(property.livingArea) || 0
      }));
    }
    
    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
    res.setHeader('X-RateLimit-Window', '60s');
    
    // Return sanitized data
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Handler Error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred processing your request'
    });
  }
}