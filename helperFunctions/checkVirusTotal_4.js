export async function checkVirusTotal(url) {
    if (!process.env.YOUR_VT_API_KEY) {
      return { blocked: false, score: 0 };
    }
    
    try {
      // Encode URL to base64 (VirusTotal requirement)
      const urlId = btoa(url).replace(/=/g, '');
      const apiUrl = `https://www.virustotal.com/api/v3/urls/${urlId}`;
      
      const response = await fetch(apiUrl, {
        headers: { 'x-apikey': API_KEYS.virustotal }
      });
      
      if (!response.ok) {
        // URL not in VirusTotal DB - submit for scanning
        await submitToVirusTotal(url);
        return { blocked: false, score: 0 };
      }
      
      const data = await response.json();
      const stats = data.data.attributes.last_analysis_stats;
      
      // Calculate malicious ratio
      const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
      const maliciousCount = stats.malicious + stats.suspicious;
      const maliciousRatio = maliciousCount / total;
      
      if (maliciousRatio > 0.1) {  // 10% of vendors flagged it
        return {
          blocked: true,
          score: maliciousRatio,
          reason: `VirusTotal: ${maliciousCount}/${total} vendors flagged as malicious`,
          layer: 'virustotal'
        };
      }
      
      return { blocked: false, score: maliciousRatio };
      
    } catch (error) {
      console.error('VirusTotal check failed:', error);
      return { blocked: false, score: 0 };
    }
  }
  
  // Submit unknown URL to VirusTotal for analysis
  async function submitToVirusTotal(url) {
    try {
      await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'x-apikey': API_KEYS.virustotal,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `url=${encodeURIComponent(url)}`
      });
    } catch (error) {
      console.error('VirusTotal submission failed:', error);
    }
  }
  