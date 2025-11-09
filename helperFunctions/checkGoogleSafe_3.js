export async function checkGoogleSafeBrowsing(url) {
    
    try {

      const { apiKeys } = await chrome.storage.local.get("apiKeys");
      const apiKey = apiKeys?.googleSafeBrowsing;
      
      if (!apiKey) {
        console.warn("⚠️ Google Safe Browsing API key not configured");
        return { blocked: false, score: 0 };
      }

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
      
      const data = await response.json();
      
      if (data.matches && data.matches.length > 0) {
        return {
          blocked: true,
          score: 0.95,
          reason: `Google Safe Browsing: ${data.matches[0].threatType}`,
          layer: 'google_safebrowsing'
        };
      }
      
      return { blocked: false, score: 0 };
      
    } catch (error) {
      console.error('Google Safe Browsing check failed:', error);
      return { blocked: false, score: 0 };
    }
  }