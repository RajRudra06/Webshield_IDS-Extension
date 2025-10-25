export function checkHeuristics(url) {
    let score = 0;
    const reasons = [];
    
    try {
      const parsed = new URL(url);
      
      // 🔴 Check 2.1: Raw IP address (suspicious)
      if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(parsed.hostname)) {
        score += 0.4;
        reasons.push('Uses raw IP address instead of domain');
      }
      
      // 🔴 Check 2.2: Suspicious TLD (free/disposable domains)
      if (/\.(tk|ml|ga|cf|gq|pw|top|xyz|club|work|info|biz|buzz|loan|click|men|wang|party|date|trade|science|cam|icu|cyou|rest|fit|surf|gdn|bid|review|racing|stream|download|zip|mov|lol|country|asia|cricket|host|press|pro|cc|co|cn)$/i.test(parsed.hostname)) {
        score += 0.3;
        reasons.push("Uses suspicious domain extension");
      }
      
      // 🔴 Check 2.3: Typosquatting (brand impersonation)
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
      
      for (let brand of popularBrands) {
        if (cleanDomain !== brand && levenshteinDistance(cleanDomain, brand) <= 2) {
          score += 0.5;
          reasons.push(`Suspicious similarity to ${brand}.com`);
          break;
        }
      }
      
      // 🔴 Check 2.4: Excessive subdomains
      const subdomainCount = parsed.hostname.split('.').length - 2;
      if (subdomainCount > 3) {
        score += 0.2;
        reasons.push(`Too many subdomains (${subdomainCount})`);
      }
      
      // 🔴 Check 2.5: URL obfuscation with @ symbol
      if (url.includes('@')) {
        score += 0.4;
        reasons.push('Contains @ symbol (URL obfuscation)');
      }
      
      // 🔴 Check 2.6: Extremely long URL (often malicious)
      if (url.length > 100) {
        score += 0.15;
        reasons.push(`Unusually long URL (${url.length} chars)`);
      }
      
      // 🔴 Check 2.7: Double slashes (path traversal attempts)
      if ((url.match(/\/\//g) || []).length > 1) {
        score += 0.2;
        reasons.push('Multiple double slashes detected');
      }
      
      // 🔴 Check 2.8: No HTTPS/HTTP (insecure)
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        score += 0.1;
        reasons.push("No HTTPS encryption");
      }
      
      // 🔴 Check 2.9: Suspicious keywords
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
            if (suspiciousWords.some(word => parsed.hostname.includes(word))) {
        score += 0.15;
        reasons.push('Contains suspicious security-related keywords');
      }
      
    } catch (error) {
      console.error('Heuristic check failed:', error);
    }
    
    return {
      blocked: score > 0.7,  // Block if score > 70%
      score: Math.min(score, 1.0),
      reasons,
      layer: 'heuristics'
    };
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