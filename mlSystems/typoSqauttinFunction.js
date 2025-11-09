import { LEGITIMATE_BRAND_DOMAINS, BRAND_KEYWORDS } from "./constants/legimateBrandDomains.js"

export function generate_all_typosquatting_patterns(brand) {
  const patterns = new Set();
  const substitutions = {
    o: ["0"],
    i: ["1", "!", "|"],
    l: ["1", "|"],
    e: ["3"],
    a: ["@", "4"],
    s: ["$", "5"],
    g: ["9"],
    t: ["7"],
    b: ["8"]
  };

  // Single substitution
  for (let i = 0; i < brand.length; i++) {
    const char = brand[i];
    if (substitutions[char]) {
      for (const rep of substitutions[char]) {
        const variant = brand.slice(0, i) + rep + brand.slice(i + 1);
        patterns.add(variant);
      }
    }
  }

  // Double substitutions
  for (let i = 0; i < brand.length; i++) {
    const char1 = brand[i];
    if (!substitutions[char1]) continue;
    for (let j = i + 1; j < brand.length; j++) {
      const char2 = brand[j];
      if (!substitutions[char2]) continue;
      for (const rep1 of substitutions[char1]) {
        for (const rep2 of substitutions[char2]) {
          const arr = brand.split("");
          arr[i] = rep1;
          arr[j] = rep2;
          patterns.add(arr.join(""));
        }
      }
    }
  }

  // Deletions
  if (brand.length > 4) {
    for (let i = 0; i < brand.length; i++) {
      patterns.add(brand.slice(0, i) + brand.slice(i + 1));
    }
  }

  // Duplications
  for (let i = 0; i < brand.length; i++) {
    const variant = brand.slice(0, i) + brand[i] + brand.slice(i);
    patterns.add(variant);
  }

  // Transpositions
  for (let i = 0; i < brand.length - 1; i++) {
    const arr = brand.split("");
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    patterns.add(arr.join(""));
  }

  return patterns;
}

export function check_typosquatting_heuristic(domainName) {
  const domainLower = domainName.toLowerCase();

  for (const legit of LEGITIMATE_BRAND_DOMAINS) {
    if (domainName === legit.split(".")[0]) return [false, null, 0.0];
  }

  for (const brand of BRAND_KEYWORDS) {
    if (domainLower === brand) continue;

    const patterns = generate_all_typosquatting_patterns(brand);
    if (patterns.has(domainLower)) return [true, brand, 0.95];

    for (const pattern of patterns) {
      if (domainLower.includes(pattern)) {
        const legitMatch = Array.from(LEGITIMATE_BRAND_DOMAINS).some(l => l.startsWith(domainLower));
        if (!legitMatch) return [true, brand, 0.9];
      }
    }

    const similarity = sequenceSimilarity(domainLower, brand);
    if (similarity >= 0.75 && similarity < 1.0) {
      if (domainLower.length <= brand.length + 2) return [true, brand, similarity];
    }
  }

  return [false, null, 0.0];
}

export function check_homograph_attack(domainName) {
  const homoglyphs = {
    a: ["а", "@", "4"],
    o: ["о", "0"],
    e: ["е", "3"],
    i: ["і", "1", "!", "|"],
    l: ["1", "|", "I"],
    c: ["с"],
    s: ["$", "5"],
    b: ["8"],
    g: ["9"],
    t: ["7"]
  };

  for (const ch of domainName.toLowerCase()) {
    if (!/[a-z0-9]/.test(ch)) continue;
    for (const [orig, reps] of Object.entries(homoglyphs)) {
      if (reps.includes(ch)) {
        const testDomain = domainName.toLowerCase().replace(ch, orig);
        if (BRAND_KEYWORDS.some(b => testDomain.includes(b))) return [true, 0.85];
      }
    }
  }

  return [false, 0.0];
}

export function apply_typosquatting_heuristic(url, modelPrediction, modelProbabilities) {
  try {
    const u = new URL(url.includes("://") ? url : "https://" + url);
    const hostname = u.hostname;
    const parts = hostname.split(".");
    const suffix = parts.pop() || "";
    const domain = parts.pop() || "";
    const fullDomain = (domain + "." + suffix).toLowerCase();

    if (LEGITIMATE_BRAND_DOMAINS.has(fullDomain))
    return {
      final_pred: "benign",
      final_proba: { benign: 0.999, phishing: 0.0005, malware: 0.0005, defacement: 0.0 },
      reason: "whitelist_match"
    };

    if (modelPrediction === "phishing" && (modelProbabilities?.phishing || 0) > 0.85)
      return {
        final_pred: modelPrediction,
        final_proba: modelProbabilities,
        reason: "model_confident"
      };
    const [isTypo, matchedBrand, typoConf] = check_typosquatting_heuristic(domain);
    if (isTypo && typoConf > 0.75)

      return {
        final_pred: "phishing",
        final_proba: { benign: 0.05, phishing: 0.92, malware: 0.02, defacement: 0.01 },
        reason: `typosquatting_${matchedBrand}`
      };

    const [isHomograph, homographConf] = check_homograph_attack(domain);
    if (isHomograph && homographConf > 0.75)
      return {
        final_pred: "phishing",
        final_proba: { benign: 0.08, phishing: 0.88, malware: 0.03, defacement: 0.01 },
        reason: "homograph_attack"
      };

    if (modelPrediction === "benign") {
      let suspiciousScore = 0;
      const reasons = [];
      const domainLower = domain.toLowerCase();

      for (const brand of BRAND_KEYWORDS) {
        if (domainLower.includes(brand) && !LEGITIMATE_BRAND_DOMAINS.has(fullDomain)) {
          suspiciousScore += 0.3;
          reasons.push(`contains_${brand}`);
        }
      }

      if (/\d/.test(domain) && /[a-z]/i.test(domain)) {
        for (const brand of BRAND_KEYWORDS) {
          const noDigits = domainLower.replace(/\d/g, "");
          const sim = sequenceSimilarity(noDigits, brand);
          if (noDigits.includes(brand) || sim > 0.75) {
            suspiciousScore += 0.4;
            reasons.push("digits_in_brand");
            break;
          }
        }
      }

      for (const brand of BRAND_KEYWORDS) {
        if (domain.length <= brand.length + 3) {
          const sim = sequenceSimilarity(domainLower, brand);
          if (sim >= 0.75 && sim < 1.0) {
            suspiciousScore += 0.3;
            reasons.push(`similar_to_${brand}`);
          }
        }
      }

      if (suspiciousScore >= 0.6)
        return {
          final_pred: "phishing",
          final_proba: { benign: 0.15, phishing: 0.8, malware: 0.03, defacement: 0.02 },
          reason: `heuristic_${reasons.join("_")}`
        };
    }

    return {
      final_pred: modelPrediction,
      final_proba: modelProbabilities,
      reason: "model_decision"
    };
  } catch (e) {
    console.error("Parsing error in apply_typosquatting_heuristic:", e);
      return {
        final_pred: modelPrediction,
        final_proba: modelProbabilities,
        reason: "parsing_error"
      };
   
  }
}

// helper for similarity (SequenceMatcher equivalent)
function sequenceSimilarity(a, b) {
  const m = Array(a.length + 1).fill(0).map(() => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] = a[i - 1] === b[j - 1]
        ? m[i - 1][j - 1] + 1
        : Math.max(m[i - 1][j], m[i][j - 1]);
    }
  }
  return m[a.length][b.length] / Math.max(a.length, b.length);
}
