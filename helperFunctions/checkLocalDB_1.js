import { isInThreatDatabase } from "../pre_database/loadDatabase.js";

export function checkLocalDatabase(url) {
    console.log('🗄️ Local Database: Checking URL:', url);
    
    const isInDatabase = isInThreatDatabase(url);
    console.log('📊 Local Database result:', isInDatabase);
    
    if (isInDatabase) {
      console.log('🚨 LOCAL DATABASE THREAT DETECTED!');
      const result = {
        blocked: true,
        score: 1.0,
        reason: 'Known malicious URL in database',
        layer: 'database'
      };
      console.log('📦 Local Database returning:', result);
      return result;
    }
    
    console.log('✅ Local Database: URL is safe (not in database)');
    const result = { blocked: false, score: 0 };
    console.log('📦 Local Database returning:', result);
    return result;
  }