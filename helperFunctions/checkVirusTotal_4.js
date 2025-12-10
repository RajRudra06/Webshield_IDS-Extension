export async function checkVirusTotal(url) {
    
  try {
    console.log('🔍 VirusTotal: Checking URL:', url);
    
    const DEFAULT_API_KEY = "ab48f76feb8562aa2856fc873f305a3e6b876202b7d515a4cfb31fefb1801693";
    
    const { apiKeys } = await chrome.storage.local.get("apiKeys");
    const apiKey = apiKeys?.virusTotal || DEFAULT_API_KEY;
    
    if (!apiKey) {
      console.warn("⚠️ VirusTotal API key not configured");
      return { blocked: false, score: 0 };
    }
    
    console.log('✅ VirusTotal API Key found, making request...');
    
    // Encode URL to base64 (VirusTotal requirement)
    const urlId = btoa(url).replace(/=/g, '');
    const apiUrl = `https://www.virustotal.com/api/v3/urls/${urlId}`;
    
    const response = await fetch(apiUrl, {
      headers: { 'x-apikey': apiKey } 
    });
    
    console.log('📡 VirusTotal response status:', response.status);
    
    if (!response.ok) {
      console.log('⚠️ URL not in VirusTotal DB - submitting for scanning');
      await submitToVirusTotal(url, apiKey); 
      return { blocked: false, score: 0 };
    }
    
    const data = await response.json();
    console.log('📦 VirusTotal API response:', data);
    
    const stats = data.data.attributes.last_analysis_stats;
    console.log('📊 Analysis stats:', stats);
    
    // Calculate malicious ratio
    const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
    const maliciousCount = stats.malicious + stats.suspicious;
    const maliciousRatio = maliciousCount / total;
    
    console.log(`🎯 Malicious ratio: ${maliciousCount}/${total} = ${(maliciousRatio * 100).toFixed(1)}%`);
    
    if (maliciousRatio > 0.1) {  // 10% of vendors flagged it
      console.log('🚨 THREAT DETECTED by VirusTotal');
      return {
        blocked: true,
        score: maliciousRatio,
        reason: `VirusTotal: ${maliciousCount}/${total} vendors flagged as malicious`,
        layer: 'virustotal'
      };
    }
    
    console.log('✅ VirusTotal: URL is safe');
    return { blocked: false, score: maliciousRatio };
    
  } catch (error) {
    console.error('❌ VirusTotal check failed:', error);
    return { blocked: false, score: 0 };
  }
}

async function submitToVirusTotal(url, apiKey) {  
  try {
    await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': apiKey, 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `url=${encodeURIComponent(url)}`
    });
    console.log('✅ URL submitted to VirusTotal for analysis');
  } catch (error) {
    console.error('❌ VirusTotal submission failed:', error);
  }
}