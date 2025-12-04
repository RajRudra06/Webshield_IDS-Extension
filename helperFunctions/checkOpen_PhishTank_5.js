// export async function checkPhishTank(url) {
//     try {
//       const apiUrl = 'https://checkurl.phishtank.com/checkurl/';
      
//       const formData = new FormData();
//       formData.append('url', url);
//       formData.append('format', 'json');
//       formData.append('app_key', 'YOUR_PHISHTANK_KEY');  // Optional
      
//       const response = await fetch(apiUrl, {
//         method: 'POST',
//         body: formData
//       });
      
//       const data = await response.json();
      
//       if (data.results.in_database && data.results.valid) {
//         return {
//           blocked: true,
//           score: 1.0,
//           reason: 'PhishTank: Confirmed phishing site',
//           layer: 'phishtank'
//         };
//       }
      
//       return { blocked: false, score: 0 };
      
//     } catch (error) {
//       console.error('PhishTank check failed:', error);
//       return { blocked: false, score: 0 };
//     }
//   }

export async function checkOpenPhish(url) {
  try {
    console.log('🔍 OpenPhish: Checking URL:', url);
    
    // Fetch the OpenPhish feed (updated hourly)
    console.log('📥 Fetching OpenPhish feed from: https://openphish.com/feed.txt');
    const response = await fetch('https://openphish.com/feed.txt');
    
    console.log('📡 OpenPhish response status:', response.status);
    
    if (!response.ok) {
      console.warn('⚠️ OpenPhish feed unavailable, status:', response.status);
      return { blocked: false, score: 0 };
    }
    
    console.log('✅ OpenPhish feed downloaded successfully');
    
    const phishingList = await response.text();
    console.log('📄 Feed size:', phishingList.length, 'characters');
    
    const phishingURLs = phishingList.split('\n').map(u => u.trim().toLowerCase()).filter(u => u.length > 0);
    
    console.log(`📊 OpenPhish database has ${phishingURLs.length} phishing URLs`);
    console.log('🔍 Sample URLs from database:', phishingURLs.slice(0, 5));
    
    // Normalize URL for comparison
    const urlToCheck = url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    console.log('🔄 Normalized URL for checking:', urlToCheck);
    
    // Check if URL is in the phishing list
    let matchedURL = null;
    const isPhishing = phishingURLs.some(phishURL => {
      const normalizedPhishURL = phishURL.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const exactMatch = normalizedPhishURL === urlToCheck;
      const partialMatch = normalizedPhishURL.includes(urlToCheck) || urlToCheck.includes(normalizedPhishURL);
      
      if (exactMatch || partialMatch) {
        matchedURL = phishURL;
        return true;
      }
      return false;
    });
    
    if (isPhishing) {
      console.log('🚨 PHISHING SITE DETECTED by OpenPhish');
      console.log('🎯 Matched against:', matchedURL);
      console.log('📦 OpenPhish result:', {
        blocked: true,
        score: 1.0,
        reason: 'OpenPhish: Confirmed phishing site',
        layer: 'openphish'
      });
      return {
        blocked: true,
        score: 1.0,
        reason: 'OpenPhish: Confirmed phishing site',
        layer: 'openphish'
      };
    }
    
    console.log('✅ OpenPhish: URL is safe (not in database)');
    console.log('📦 OpenPhish result:', { blocked: false, score: 0 });
    return { blocked: false, score: 0 };
    
  } catch (error) {
    console.error('❌ OpenPhish check failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return { blocked: false, score: 0 };
  }
}