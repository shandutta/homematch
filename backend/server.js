// server.js - HomeMatch Backend Server
// This server handles API calls to avoid CORS issues

const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors());
app.use(express.json());

// API Keys (use environment variables in production)
const API_KEYS = {
    rapidApi: process.env.RAPIDAPI_KEY || '12ddc4fe6dmshf8877dcf8ace2e1p176cb2jsn72195d55b39f',
    googleMaps: process.env.GOOGLE_MAPS_KEY || 'AIzaSyAexU5wunndanLJ0DP_MytQJOQcvrRVyP8',
    scraperApi: process.env.SCRAPER_API_KEY || '3629db678115e571cf5a4bb14fe66a81',
    supabaseUrl: process.env.SUPABASE_URL || 'https://aslhdzdanhfkyshphxpr.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbGhkemRhbmhma3lzaHBoeHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMzU4NzUsImV4cCI6MjA2NjkxMTg3NX0.FXwUXaIPo_xHi96kK3Qa4cN2lWbBWOgWzhZZ-41Mzn0'
};

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'HomeMatch API is running!' });
});

// Zillow API proxy endpoint
app.get('/api/zillow/search', async (req, res) => {
    const { location = 'Palo Alto, CA', priceMin = '1800000', priceMax = '2300000' } = req.query;
    
    try {
        const response = await fetch(
            `https://zillow56.p.rapidapi.com/search?location=${encodeURIComponent(location)}&status=forSale&price_min=${priceMin}&price_max=${priceMax}&home_type=Houses`,
            {
                headers: {
                    'X-RapidAPI-Key': API_KEYS.rapidApi,
                    'X-RapidAPI-Host': 'zillow56.p.rapidapi.com'
                }
            }
        );

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Zillow API error: ${response.status}`);
        }

        res.json(data);
    } catch (error) {
        console.error('Zillow API error:', error);
        res.status(500).json({ error: 'Failed to fetch Zillow data', details: error.message });
    }
});

// Get all properties (from Supabase)
app.get('/api/properties', async (req, res) => {
    try {
        const response = await fetch(
            `${API_KEYS.supabaseUrl}/rest/v1/properties?select=*&order=match_percentage.desc`,
            {
                headers: {
                    'apikey': API_KEYS.supabaseKey,
                    'Authorization': `Bearer ${API_KEYS.supabaseKey}`
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                // Table doesn't exist yet
                return res.json([]);
            }
            throw new Error(`Supabase error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Supabase error:', error);
        res.status(500).json({ error: 'Failed to fetch properties', details: error.message });
    }
});

// Google Maps Distance Matrix proxy
app.post('/api/maps/distance', async (req, res) => {
    const { origin, destinations } = req.body;
    
    try {
        const destinationsStr = destinations.join('|');
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destinationsStr)}&key=${API_KEYS.googleMaps}&mode=driving&units=imperial`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status !== 'OK') {
            throw new Error(`Google Maps API error: ${data.status}`);
        }

        res.json(data);
    } catch (error) {
        console.error('Google Maps error:', error);
        res.status(500).json({ error: 'Failed to calculate distances', details: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 HomeMatch server running on http://localhost:${PORT}`);
    console.log(`📍 Test the API at http://localhost:${PORT}/api/test`);
});

// Instructions for setup:
// 1. Create a new folder for your backend
// 2. Run: npm init -y
// 3. Run: npm install express cors node-fetch dotenv
// 4. Save this file as server.js
// 5. Run: node server.js