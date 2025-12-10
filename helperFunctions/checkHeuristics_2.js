export function checkHeuristics(url) {
  console.log('🔍 Heuristics: Starting check for URL:', url);
  
  let score = 0;
  const reasons = [];
  
  try {
    const parsed = new URL(url);
    console.log('📋 Parsed URL components:', {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search
    });
    
    // 🔴 Check 2.1: Raw IP address (suspicious)
    const hasIP = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(parsed.hostname);
    console.log('🔍 Check 2.1 - Raw IP address:', hasIP);
    if (hasIP) {
      score += 0.4;
      reasons.push('Uses raw IP address instead of domain');
      console.log('⚠️ Score +0.4 (IP address detected)');
    }
    
    // 🔴 Check 2.2: Suspicious TLD (free/disposable domains)
    const hasSuspiciousTLD = /\.(tk|ml|ga|cf|gq|pw|top|xyz|club|work|info|biz|buzz|loan|click|men|wang|party|date|trade|science|cam|icu|cyou|rest|fit|surf|gdn|bid|review|racing|stream|download|zip|mov|lol|country|asia|cricket|host|press|pro|cc|co|cn)$/i.test(parsed.hostname);
    console.log('🔍 Check 2.2 - Suspicious TLD:', hasSuspiciousTLD);
    if (hasSuspiciousTLD) {
      score += 0.3;
      reasons.push("Uses suspicious domain extension");
      console.log('⚠️ Score +0.3 (Suspicious TLD detected)');
    }
    
    // 🔴 Check 2.3: Typosquatting (brand impersonation)
    console.log('🔍 Check 2.3 - Checking for typosquatting...');
    const popularBrands = ['google', 'gmail', 'facebook', 'instagram', 'whatsapp', 'amazon', 
    'microsoft', 'apple', 'icloud', 'paypal', 'netflix', 'twitter', 
    'linkedin', 'youtube', 'reddit', 'tiktok', 'pinterest', 'snapchat',
    'flipkart', 'paytm', 'phonepe', 'myntra', 'snapdeal', 'nykaa', 'meesho',
    'icici', 'hdfc', 'sbi', 'axis', 'kotak', 'pnb', 'canara', 'bob',
    'swiggy', 'zomato', 'ola', 'uber', 'makemytrip', 'goibibo', 'irctc',
    'ebay', 'etsy', 'yahoo', 'github', 'stackoverflow', 'medium', 'wordpress',
    'shopify', 'adobe', 'salesforce', 'spotify', 'zoom', 'dropbox', 'wikipedia',
    'chase', 'wellsfargo', 'citibank', 'bankofamerica',
    'dhl', 'fedex', 'ups', 'usps'];
    const cleanDomain = parsed.hostname.replace(/[^a-z]/gi, '').toLowerCase();
    console.log('🧹 Clean domain for comparison:', cleanDomain);
    
    let typosquattingFound = false;
    for (let brand of popularBrands) {
      if (cleanDomain !== brand && levenshteinDistance(cleanDomain, brand) <= 2) {
        score += 0.5;
        reasons.push(`Suspicious similarity to ${brand}.com`);
        console.log(`🚨 Typosquatting detected! Similar to "${brand}" (distance: ${levenshteinDistance(cleanDomain, brand)})`);
        console.log('⚠️ Score +0.5 (Typosquatting detected)');
        typosquattingFound = true;
        break;
      }
    }
    if (!typosquattingFound) {
      console.log('✅ No typosquatting detected');
    }
    
    // 🔴 Check 2.4: Excessive subdomains
    const subdomainCount = parsed.hostname.split('.').length - 2;
    console.log('🔍 Check 2.4 - Subdomain count:', subdomainCount);
    if (subdomainCount > 3) {
      score += 0.2;
      reasons.push(`Too many subdomains (${subdomainCount})`);
      console.log('⚠️ Score +0.2 (Excessive subdomains)');
    }
    
    // 🔴 Check 2.5: URL obfuscation with @ symbol
    const hasAtSymbol = url.includes('@');
    console.log('🔍 Check 2.5 - Contains @ symbol:', hasAtSymbol);
    if (hasAtSymbol) {
      score += 0.4;
      reasons.push('Contains @ symbol (URL obfuscation)');
      console.log('⚠️ Score +0.4 (@ symbol obfuscation)');
    }
    
    // 🔴 Check 2.6: Extremely long URL (often malicious)
    console.log('🔍 Check 2.6 - URL length:', url.length);
    if (url.length > 100) {
      score += 0.15;
      reasons.push(`Unusually long URL (${url.length} chars)`);
      console.log('⚠️ Score +0.15 (Long URL)');
    }
    
    // 🔴 Check 2.7: Double slashes (path traversal attempts)
    const doubleSlashCount = (url.match(/\/\//g) || []).length;
    console.log('🔍 Check 2.7 - Double slash count:', doubleSlashCount);
    if (doubleSlashCount > 1) {
      score += 0.2;
      reasons.push('Multiple double slashes detected');
      console.log('⚠️ Score +0.2 (Multiple double slashes)');
    }
    
    // 🔴 Check 2.8: No HTTPS/HTTP (insecure)
    console.log('🔍 Check 2.8 - Protocol:', parsed.protocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      score += 0.1;
      reasons.push("No HTTPS encryption");
      console.log('⚠️ Score +0.1 (Non-standard protocol)');
    }
    
    // 🔴 Check 2.9: Suspicious keywords
    console.log('🔍 Check 2.9 - Checking for suspicious keywords...');
    const suspiciousWords = [
      'login', 'signin', 'signup', 'register', 'account', 'user', 'verify', 'verification',
      'secure', 'security', 'update', 'confirm', 'validate', 'auth', 'authenticate',
      'password', 'pass', 'credential', 'creds', 'reset', 'recover', 'unlock',
      'bank', 'wallet', 'payment', 'invoice', 'billing', 'pay', 'money', 'fund', 'transfer',
      'checkout', 'purchase', 'order', 'transaction',
      'alert', 'notice', 'warning', 'urgent', 'immediate', 'action', 'required',
      'support', 'helpdesk', 'service', 'customer', 'assist', 'contact',
      'blocked', 'suspended', 'expired', 'deactivated', 'limited', 'restriction',
      'reactivate', 'restore', 'renew', 'relogin',
      'free', 'bonus', 'reward', 'gift', 'offer', 'promo', 'discount', 'deal', 'sale', 'win', 'winner', 'claim', 'prize',
      'click', 'download', 'install', 'run', 'execute', 'access', 'open', 'continue', 'redirect',
      'updateinfo', 'submit', 'verifyemail', 'emailupdate', 'securelogin',
      'walletconnect', 'metamask', 'crypto', 'exchange', 'airdrop',
      'document', 'invoice', 'statement', 'receipt', 'form', 'report',
      'resetpassword', 'myaccount', 'accountverify', 'accountupdate', 'verificationcenter'
    ];
    const hasSuspiciousKeyword = suspiciousWords.some(word => parsed.hostname.includes(word));
    console.log('🔍 Suspicious keyword found:', hasSuspiciousKeyword);
    if (hasSuspiciousKeyword) {
      score += 0.15;
      reasons.push('Contains suspicious security-related keywords');
      const foundWords = suspiciousWords.filter(word => parsed.hostname.includes(word));
      console.log('⚠️ Score +0.15 (Keywords found:', foundWords.join(', ') + ')');
    }
    
    console.log('📊 Final heuristics score:', score);
    console.log('📋 Reasons collected:', reasons);
    
  } catch (error) {
    console.error('❌ Heuristic check failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
  
  const finalResult = {
    blocked: score > 0.7,  // Block if score > 70%
    score: Math.min(score, 1.0),
    reasons,
    layer: 'heuristics'
  };
  
  console.log('📦 Heuristics result:', finalResult);
  if (finalResult.blocked) {
    console.log('🚨 HEURISTICS BLOCKING: Score exceeded threshold (0.7)');
  } else {
    console.log('✅ Heuristics: URL passed checks (score below threshold)');
  }
  
  return finalResult;
}

// Helper: Calculate string similarity (Levenshtein distance)
export function levenshteinDistance(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i-1] === a[j-1]) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
