export function checkHeuristics(url) {
  console.log("🔍 Heuristics: Starting check for URL:", url);

  let score = 0;
  const reasons = [];
  let highRisk = false;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    console.log("📋 Parsed URL components:", {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search
    });

    // ======================================================
    // SUSPICIOUS KEYWORD SET
    // ======================================================
    const suspiciousWords = [
      "login","signin","signup","account","verify","auth","password",
      "wallet","payment","invoice","loan","crypto","exchange","bank",
      "secure","update","confirm","warning","alert","urgent","blocked",
      "support","helpdesk","customer","service","portal",
      "free","bonus","reward","gift","offer","prize",
      "download","install","run","access",
      "pdf","document","form","receipt",
      "gov","tax","passport"
    ];

    const containsKeyword = suspiciousWords.some(w => hostname.includes(w));

    // ======================================================
    // 2.1 — RAW IP ADDRESS
    // ======================================================
    const hasIP = /\d{1,3}(\.\d{1,3}){3}/.test(hostname);
    console.log("🔍 Check 2.1 - Raw IP address:", hasIP);

    if (hasIP) {
      score += 0.4;
      reasons.push("Uses raw IP address");

      if (containsKeyword) {
        highRisk = true;
        reasons.push("IP + suspicious keyword");
      }
    }

    // ======================================================
    // 2.2 — SUSPICIOUS TLD
    // ======================================================
    const hasSuspiciousTLD =
      /\.(tk|ml|ga|cf|gq|pw|top|xyz|cam|icu|zip|mov|lol|gdn|bid|review|download|stream|party)$/i
        .test(hostname);

    console.log("🔍 Check 2.2 - Suspicious TLD:", hasSuspiciousTLD);

    if (hasSuspiciousTLD) {
      score += 0.3;
      reasons.push("Suspicious TLD");
    }

    // ======================================================
    // 2.3 — IMPROVED TYPOSQUATTING
    // ======================================================
    console.log("🔍 Check 2.3 - Checking for typosquatting...");

    const popularBrands = [
      "google","gmail","facebook","instagram","whatsapp","amazon",
      "microsoft","apple","icloud","paypal","netflix","twitter",
      "linkedin","youtube","reddit","tiktok","pinterest","snapchat",
      "flipkart","paytm","phonepe","myntra","snapdeal","nykaa","meesho",
      "hdfc","sbi","axis","icici","kotak","pnb","canara",
      "swiggy","zomato","ola","uber","irctc",
      "yahoo","github","medium","wordpress","shopify","spotify","zoom",
      "adobe","salesforce","dropbox","wikipedia"
    ];

    const parts = hostname.split(".");
    const domainCore = parts[parts.length - 2] || hostname;

    const cleaned = domainCore.replace(/[^a-z0-9]/gi, "");
    const homoglyphs = { "0": "o", "1": "l", "3": "e", "5": "s", "8": "b" };
    const corrected = cleaned.replace(/[01358]/g, c => homoglyphs[c]);

    for (const brand of popularBrands) {
      const official1 = `${brand}.com`;
      const official2 = `www.${brand}.com`;

      // ✔ Skip ALL official brand domains
      if (hostname === official1 || hostname === official2) {
        continue;
      }

      const dist1 = levenshteinDistance(cleaned, brand);
      const dist2 = levenshteinDistance(corrected, brand);
      const dist = Math.min(dist1, dist2);

      // ✔ Ignore exact matches
      if (dist === 0) continue;

      // ✔ Trigger only distance 1–2
      if (dist > 0 && dist <= 2) {
        highRisk = true;
        reasons.push(`Brand impersonation (${brand})`);
        console.log(`🚨 Typosquatting detected: ${brand} (dist=${dist})`);
        break;
      }
    }

    // ======================================================
    // 2.4 — EXCESSIVE SUBDOMAINS
    // ======================================================
    const subdomainCount = hostname.split(".").length - 2;
    if (subdomainCount > 3) {
      score += 0.2;
      reasons.push(`Too many subdomains (${subdomainCount})`);
    }

    // ======================================================
    // 2.5 — '@' OBFUSCATION
    // ======================================================
    if (url.includes("@")) {
      score += 0.4;
      reasons.push("Contains @ symbol (obfuscation)");
    }

    // ======================================================
    // 2.6 — LONG URL
    // ======================================================
    if (url.length > 110) {
      score += 0.1;
      reasons.push(`Long URL (${url.length} chars)`);
    }

    // ======================================================
    // 2.7 — MULTIPLE '//'
    // ======================================================
    const doubleSlashCount = (url.match(/\/\//g) || []).length;
    if (doubleSlashCount > 1) {
      score += 0.1;
      reasons.push("Multiple double slashes");
    }

    // ======================================================
    // 2.8 — NO HTTPS
    // ======================================================
    if (parsed.protocol !== "https:") {
      score += 0.1;
      reasons.push("Not HTTPS");
    }

    // ======================================================
    // 2.9 — SUSPICIOUS KEYWORDS
    // ======================================================
    if (containsKeyword) {
      score += 0.15;
      reasons.push("Suspicious keyword in hostname");
    }

  } catch (err) {
    console.error("❌ Heuristic failure:", err);
  }

  // ======================================================
  // FINAL DECISION
  // ======================================================
  const finalResult = {
    blocked: highRisk || score >= 0.55,
    score: Math.min(score, 1),
    reasons,
    layer: "heuristics"
  };

  console.log("📦 Heuristics result:", finalResult);
  return finalResult;
}


// ======================================================
// Levenshtein Distance (unchanged)
// ======================================================
export function levenshteinDistance(a, b) {
  const dp = [];
  for (let i = 0; i <= b.length; i++) dp[i] = [i];
  for (let j = 0; j <= a.length; j++) dp[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      dp[i][j] =
        b[i - 1] === a[j - 1]
          ? dp[i - 1][j - 1]
          : Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
    }
  }
  return dp[b.length][a.length];
}
