export function checkHeuristics(url) {
  console.log('🔍 Heuristics: Starting check for URL:', url);

  let score = 0;
  const reasons = [];
  let highRisk = false; // high-severity flags (e.g. typosquatting)

  try {
    const parsed = new URL(url);
    console.log('📋 Parsed URL components:', {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search
    });

    // 🔴 Check 2.1: Raw IP address
    const hasIP = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(parsed.hostname);
    console.log('🔍 Check 2.1 - Raw IP address:', hasIP);
    if (hasIP) {
      score += 0.4;
      reasons.push('Uses raw IP address instead of domain');
    }

    // 🔴 Check 2.2: Suspicious TLD
    const hasSuspiciousTLD = /\.(tk|ml|ga|cf|gq|pw|top|xyz|club|work|info|biz|buzz|loan|click|men|wang|party|date|trade|science|cam|icu|cyou|rest|fit|surf|gdn|bid|review|racing|stream|download|zip|mov|lol|country|asia|cricket|host|press|pro|cc|co|cn)$/i
      .test(parsed.hostname);
    console.log('🔍 Check 2.2 - Suspicious TLD:', hasSuspiciousTLD);
    if (hasSuspiciousTLD) {
      score += 0.3;
      reasons.push("Uses suspicious domain extension");
    }

    // 🔴 Check 2.3: Typosquatting (high-severity)
    console.log('🔍 Check 2.3 - Checking for typosquatting...');

    const popularBrands = [
      'google','gmail','facebook','instagram','whatsapp','amazon',
      'microsoft','apple','icloud','paypal','netflix','twitter',
      'linkedin','youtube','reddit','tiktok','pinterest','snapchat',
      'flipkart','paytm','phonepe','myntra','snapdeal','nykaa','meesho',
      'icici','hdfc','sbi','axis','kotak','pnb','canara','bob',
      'swiggy','zomato','ola','uber','makemytrip','goibibo','irctc',
      'ebay','etsy','yahoo','github','stackoverflow','medium','wordpress',
      'shopify','adobe','salesforce','spotify','zoom','dropbox','wikipedia',
      'chase','wellsfargo','citibank','bankofamerica',
      'dhl','fedex','ups','usps'
    ];

    const parts = parsed.hostname.split('.');
    const domainCore = parts[parts.length - 2] || parsed.hostname;

    const cleaned = domainCore.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const homoglyphs = { '0':'o', '1':'l', '3':'e', '5':'s', '8':'b' };
    const corrected = cleaned.replace(/[01358]/g, c => homoglyphs[c]);

    console.log('🧹 Domain core cleaned:', cleaned);
    console.log('🔄 Domain core corrected:', corrected);

    for (const brand of popularBrands) {
      const dr = levenshteinDistance(cleaned, brand);
      const dc = levenshteinDistance(corrected, brand);
      if (cleaned !== brand && Math.min(dr, dc) <= 2) {
        highRisk = true;
        reasons.push(`Suspicious similarity to ${brand}.com`);
        console.log(`🚨 Typosquatting detected: "${brand}" raw=${dr} corrected=${dc}`);
        break;
      }
    }

    if (!highRisk) {
      console.log('✅ No typosquatting detected');
    }

    // 🔴 Check 2.4: Excessive subdomains
    const subdomainCount = parsed.hostname.split('.').length - 2;
    console.log('🔍 Check 2.4 - Subdomain count:', subdomainCount);
    if (subdomainCount > 3) {
      score += 0.2;
      reasons.push(`Too many subdomains (${subdomainCount})`);
    }

    // 🔴 Check 2.5: @ obfuscation
    const hasAtSymbol = url.includes('@');
    console.log('🔍 Check 2.5 - Contains @ symbol:', hasAtSymbol);
    if (hasAtSymbol) {
      score += 0.4;
      reasons.push('Contains @ symbol (URL obfuscation)');
    }

    // 🔴 Check 2.6: Long URL
    console.log('🔍 Check 2.6 - URL length:', url.length);
    if (url.length > 100) {
      score += 0.15;
      reasons.push(`Unusually long URL (${url.length} chars)`);
    }

    // 🔴 Check 2.7: Multiple double slashes
    const doubleSlashCount = (url.match(/\/\//g) || []).length;
    console.log('🔍 Check 2.7 - Double slash count:', doubleSlashCount);
    if (doubleSlashCount > 1) {
      score += 0.2;
      reasons.push('Multiple double slashes detected');
    }

    // 🔴 Check 2.8: Protocol
    console.log('🔍 Check 2.8 - Protocol:', parsed.protocol);
    if (parsed.protocol !== "https:") {
      score += 0.1;
      reasons.push("No HTTPS encryption");
    }

    // 🔴 Check 2.9: Suspicious keywords
    console.log('🔍 Check 2.9 - Checking for suspicious keywords...');
    const suspiciousWords = [
      'login','signin','signup','register','account','verify','secure',
      'password','bank','wallet','payment','invoice','alert','urgent',
      'support','blocked','suspended','expired','free','bonus','crypto'
    ];
    const hasKeyword = suspiciousWords.some(w => parsed.hostname.includes(w));
    console.log('🔍 Suspicious keyword found:', hasKeyword);
    if (hasKeyword) {
      score += 0.15;
      reasons.push('Contains suspicious keywords');
    }

    console.log('📊 Final heuristics score:', score);
    console.log('📋 Reasons collected:', reasons);

  } catch (err) {
    console.error('❌ Heuristic check failed:', err);
  }

  // ✔️ Final decision logic
  const finalResult = {
    blocked: highRisk || score > 0.7,
    score: Math.min(score, 1.0),
    reasons,
    layer: 'heuristics'
  };

  console.log('📦 Heuristics result:', finalResult);
  return finalResult;
}

// Helper
export function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i-1] === a[j-1]
        ? matrix[i-1][j-1]
        : Math.min(matrix[i-1][j-1] + 1,
                   matrix[i][j-1] + 1,
                   matrix[i-1][j] + 1)
    }
  }
  return matrix[b.length][a.length];
}
