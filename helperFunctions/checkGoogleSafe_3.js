  export async function checkGoogleSafeBrowsing(url) {
    
    try {
      console.log('🔍 Google Safe Browsing: Checking URL:', url);

      const DEFAULT_API_KEY = "AIzaSyAkM1snPtAaHFSJcD_ybeJVtJHh-dOPhrs";

      const { apiKeys } = await chrome.storage.local.get("apiKeys");
      const apiKey = apiKeys?.googleSafeBrowsing || DEFAULT_API_KEY;
      
      if (!apiKey) {
        console.warn("⚠️ Google Safe Browsing API key not configured");
        return { blocked: false, score: 0 };
      }

      console.log('✅ API Key found, making request...');

      const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            clientId: 'webshield-ids',
            clientVersion: '1.0.0'
          },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        })
      });
      
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Google Safe Browsing API response:', data);
      
      if (data.matches && data.matches.length > 0) {
        console.log('🚨 THREAT DETECTED:', data.matches);
        return {
          blocked: true,
          score: 0.95,
          reason: `Google Safe Browsing: ${data.matches[0].threatType}`,
          layer: 'google_safebrowsing'
        };
      }
      
      console.log('✅ Google Safe Browsing: URL is safe (no matches)');
      return { blocked: false, score: 0 };
      
    } catch (error) {
      console.error('❌ Google Safe Browsing check failed:', error);
      return { blocked: false, score: 0 };
    }
  }