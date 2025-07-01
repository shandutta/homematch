import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // This will create tables via Supabase Dashboard SQL editor
    // Return success for now
    res.status(200).json({ 
      message: 'Use Supabase Dashboard to create tables',
      sql: getSchemaSql()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function getSchemaSql() {
  return `
-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id BIGSERIAL PRIMARY KEY,
  zpid VARCHAR UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR,
  price INTEGER,
  beds INTEGER,
  baths NUMERIC,
  sqft INTEGER,
  image_url TEXT,
  match_score FLOAT DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id BIGINT REFERENCES properties(id),
  user_email VARCHAR NOT NULL,
  vote BOOLEAN NOT NULL,
  swiped_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id, user_email)
);

-- Indexes for performance
CREATE INDEX idx_properties_zpid ON properties(zpid);
CREATE INDEX idx_swipes_user ON swipes(user_email);
CREATE INDEX idx_properties_match_score ON properties(match_score DESC);
  `;
}