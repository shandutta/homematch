// api/debug-supabase.js - Debug endpoint to test Supabase connection
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const debug = {
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      urlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.slice(0, 20) + '...' : 'not set',
      keyPrefix: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.slice(0, 10) + '...' : 'not set'
    },
    tests: {}
  };
  
  // Test 1: Can create client?
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      debug.tests.clientCreated = true;
      
      // Test 2: Can query properties table?
      try {
        const { data, error, count } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          debug.tests.propertiesQuery = { 
            success: false, 
            error: error.message,
            code: error.code 
          };
        } else {
          debug.tests.propertiesQuery = { 
            success: true,
            tableExists: true
          };
        }
      } catch (e) {
        debug.tests.propertiesQuery = { 
          success: false, 
          error: e.message 
        };
      }
      
      // Test 3: Can query swipes table?
      try {
        const { data, error, count } = await supabase
          .from('swipes')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          debug.tests.swipesQuery = { 
            success: false, 
            error: error.message,
            code: error.code 
          };
        } else {
          debug.tests.swipesQuery = { 
            success: true,
            tableExists: true
          };
        }
      } catch (e) {
        debug.tests.swipesQuery = { 
          success: false, 
          error: e.message 
        };
      }
      
    } else {
      debug.tests.clientCreated = false;
      debug.tests.missingConfig = true;
    }
  } catch (e) {
    debug.tests.clientCreated = false;
    debug.tests.error = e.message;
  }
  
  res.status(200).json(debug);
}