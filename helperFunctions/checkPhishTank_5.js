export async function checkPhishTank(url) {
    try {
      const apiUrl = 'https://checkurl.phishtank.com/checkurl/';
      
      const formData = new FormData();
      formData.append('url', url);
      formData.append('format', 'json');
      formData.append('app_key', 'YOUR_PHISHTANK_KEY');  // Optional
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.results.in_database && data.results.valid) {
        return {
          blocked: true,
          score: 1.0,
          reason: 'PhishTank: Confirmed phishing site',
          layer: 'phishtank'
        };
      }
      
      return { blocked: false, score: 0 };
      
    } catch (error) {
      console.error('PhishTank check failed:', error);
      return { blocked: false, score: 0 };
    }
  }