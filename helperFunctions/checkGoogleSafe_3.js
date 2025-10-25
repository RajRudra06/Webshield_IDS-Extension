export async function checkGoogleSafeBrowsing(url) {
    if (!process.env.YOUR_GOOGLE_API_KEY) {
      return { blocked: false, score: 0 };
    }
    
    try {
      const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.YOUR_GOOGLE_API_KEY}`;
      
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