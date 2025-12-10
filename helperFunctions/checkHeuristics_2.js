export function checkHeuristics(url) {
  console.log('🔍 Heuristics: Starting check for URL:', url);

  let score = 0;
  const reasons = [];
  let highRisk = false;

  try {
    const parsed = new URL(url);
    console.log('📋 Parsed URL components:', {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search
    });

    const hostname = parsed.hostname.toLowerCase();

    // ===========================
    // HIGH-RISK KEYWORD SET
    // ===========================
    const suspiciousWords = [
      // Auth / Login
      'login','signin','signup','register','account','user','profile',
      'verify','verification','2fa','otp','auth','authenticate','token',
      'password','pass','credential','creds','reset','recover','unlock',

      // Banking / Finance
      'bank','wallet','payment','pay','upi','billing','invoice','transaction',
      'fund','transfer','loan','money','walletconnect','metamask','crypto',
      'exchange','airdrop','deposit','withdraw','payout','finance','debit','credit',

      // Security / Threat
      'secure','security','safety','update','confirm','validate','protection',
      'malware','firewall','anti','threat','scan','breach','privacy',
      'alert','notice','warning','urgent','action','required','immediate',
      'blocked','suspended','expired','deactivated','limited','restriction',
      'reactivate','restore','renew','relogin','unlock',

      // Customer / Support
      'support','helpdesk','service','customer','assist','contact','portal',
      'livechat','helpline','complaint','feedback','inquiry',

      // Rewards / Scam Bait
      'free','bonus','reward','gift','offer','promo','discount','deal',
      'sale','win','winner','claim','prize','jackpot','coupon','voucher',

      // Download / Execution
      'download','install','run','execute','access','open','continue',
      'redirect','confirmemail','verifyemail','submit','checkout',

      // Docs / Files
      'document','statement','receipt','form','report','notice',
      'pdf','attachment','viewfile','downloadfile',

      // Reactivation
      'reverify','accountverify','accountupdate','verificationcenter',
      'unlockaccount','unlockid',

      // Government
      'pan','aadhar','socialsecurity','irs','tax','revenue','gov','customs','passport'
    ];

    const containsKeyword = suspiciousWords.some(w => hostname.includes(w));

    // ===========================
    // 2.1 RAW IP ADDRESS
    // ===========================
    const hasIP =
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(hostname);
    console.log('🔍 Check 2.1 - Raw IP address:', hasIP);
    if (hasIP) {
      score += 0.4;
      reasons.push("Uses raw IP address");

      // HIGH-RISK COMBO → BLOCK
      if (containsKeyword) {
        highRisk = true;
        reasons.push("IP + suspicious keyword");
      }
    }

    // ===========================
    // 2.2 SUSPICIOUS TLD
    // ===========================
    const hasSuspiciousTLD =
      /\.(tk|ml|ga|cf|gq|pw|top|xyz|club|work|info|biz|buzz|loan|click|men|wang|party|date|trade|science|cam|icu|cyou|rest|fit|surf|gdn|bid|review|racing|stream|download|zip|mov|lol|country|asia|cricket|host|press|pro|cc|co|cn)$/i
        .test(hostname);

    console.log('🔍 Check 2.2 - Suspicious TLD:', hasSuspiciousTLD);

    if (hasSuspiciousTLD) {
      score += 0.3;
      reasons.push("Suspicious TLD");

      // COMBO: bank + suspicious TLD → HIGH RISK
      if (hostname.includes("bank") || hostname.includes("pay")) {
        highRisk = true;
        reasons.push("Banking + suspicious TLD");
      }
    }

    // ===========================
    // 2.3 TYPOSQUATTING
    // ===========================
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
      'chase','wellsfargo','citibank','bankofamerica','dhl','fedex','ups','usps'
    ];

    const parts = hostname.split('.');
    const domainCore = parts[parts.length - 2] || hostname;

    const cleaned = domainCore.replace(/[^a-z0-9]/gi, '');
    const homoglyphs = { '0':'o', '1':'l', '3':'e', '5':'s', '8':'b' };
    const corrected = cleaned.replace(/[01358]/g, c => homoglyphs[c]);

    for (const brand of popularBrands) {

      // 🔒 Skip official domains (prevent false positives)
      const officialDomain = `${brand}.com`;
      if (hostname === officialDomain) {
        console.log(`ℹ️ Skipping typosquatting check for official domain: ${officialDomain}`);
        continue;
      }

      const dr = levenshteinDistance(cleaned, brand);
      const dc = levenshteinDistance(corrected, brand);
      const dist = Math.min(dr, dc);

      // Typosquatting trigger
      if (dist <= 2) {
        highRisk = true;
        reasons.push(`Brand impersonation (${brand})`);
        console.log(`🚨 Typosquatting detected: ${brand} (distance=${dist})`);
        break;
      }
    }

    // ===========================
    // 2.4 EXCESSIVE SUBDOMAINS
    // ===========================
    const subdomainCount = hostname.split('.').length - 2;
    if (subdomainCount > 3) {
      score += 0.2;
      reasons.push(`Too many subdomains (${subdomainCount})`);
    }

    // ===========================
    // 2.5 @ SYMBOL OBFUSCATION
    // ===========================
    const hasAtSymbol = url.includes('@');
    if (hasAtSymbol) {
      score += 0.4;
      reasons.push("Uses @ obfuscation");

      // Combo: @ + keyword = HIGH RISK
      if (containsKeyword) {
        highRisk = true;
        reasons.push("@ + suspicious keyword");
      }
    }

    // ===========================
    // 2.6 LONG URL
    // ===========================
    if (url.length > 100) {
      score += 0.15;
      reasons.push(`Long URL (${url.length} chars)`);
    }

    // ===========================
    // 2.7 DOUBLE SLASHES
    // ===========================
    const doubleSlashCount = (url.match(/\/\//g) || []).length;
    if (doubleSlashCount > 1) {
      score += 0.2;
      reasons.push("Multiple double slashes");
    }

    // ===========================
    // 2.8 NO HTTPS
    // ===========================
    if (parsed.protocol !== "https:") {
      score += 0.1;
      reasons.push("Not using HTTPS");

      // Combo: keyword + no HTTPS → high risk
      if (containsKeyword) {
        highRisk = true;
        reasons.push("Keyword + insecure protocol");
      }
    }

    // ===========================
    // 2.9 SUSPICIOUS KEYWORDS
    // ===========================
    if (containsKeyword) {
      score += 0.15;
      reasons.push("Suspicious keyword in hostname");
    }

  } catch (err) {
    console.error('❌ Heuristic failure:', err);
  }

  // ===========================
  // FINAL DECISION
  // ===========================
  const finalResult = {
    blocked: highRisk || score >= 0.5,
    score: Math.min(score, 1),
    reasons,
    layer: "heuristics"
  };

  console.log("📦 Heuristics result:", finalResult);
  return finalResult;
}

// Helper
export function levenshteinDistance(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] =
        b[i - 1] === a[j - 1]
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}
